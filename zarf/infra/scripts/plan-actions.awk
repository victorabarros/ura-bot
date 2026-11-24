# Read `terraform show -json` and print "<address> <action,action>".
# Terraform emits one compact JSON document. Only the resource_changes
# array is read, so addresses in planned_values and prior_state are ignored.
function read_string(json, pos,    n, out, c, esc) {
  n = length(json)
  out = ""
  esc = 0
  pos++
  while (pos <= n) {
    c = substr(json, pos, 1)
    if (esc) {
      if (c == "\"" || c == "\\") out = out c
      else out = out c
      esc = 0
    } else if (c == "\\") {
      esc = 1
    } else if (c == "\"") {
      str_val = out
      return pos
    } else {
      out = out c
    }
    pos++
  }
  str_val = out
  return pos
}

function find_key(json, key, from,    at) {
  at = index(substr(json, from), key)
  if (at == 0) return 0
  return from + at - 1 + length(key)
}

function process_object(obj,    pos, addr, actions, action) {
  pos = find_key(obj, "\"address\":\"", 1)
  if (pos == 0) return
  pos = read_string(obj, pos - 1)
  addr = str_val
  pos = find_key(obj, "\"actions\":[", pos)
  if (pos == 0) return
  actions = ""
  while (pos <= length(obj)) {
    c = substr(obj, pos, 1)
    if (c == "]") break
    if (c == "\"") {
      pos = read_string(obj, pos)
      action = str_val
      if (actions == "") actions = action
      else actions = actions "," action
    }
    pos++
  }
  print addr " " actions
}

BEGIN {
  json = ""
}
{
  json = json $0
}
END {
  pos = find_key(json, "\"resource_changes\":", 1)
  if (pos == 0) exit 0
  n = length(json)
  depth = 0
  in_str = 0
  esc = 0
  start = 0
  for (p = pos; p <= n; p++) {
    c = substr(json, p, 1)
    if (in_str) {
      if (esc) esc = 0
      else if (c == "\\") esc = 1
      else if (c == "\"") in_str = 0
      continue
    }
    if (c == "\"") {
      in_str = 1
      continue
    }
    if (c == "{" || c == "[") {
      if (depth == 1 && c == "{") start = p
      depth++
      continue
    }
    if (c == "}" || c == "]") {
      if (depth == 2 && c == "}" && start > 0) {
        process_object(substr(json, start, p - start + 1))
        start = 0
      }
      depth--
      if (depth == 0) break
    }
  }
}
