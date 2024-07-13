import React from "react"
import { StyleSheet, Text, View } from "react-native"

function App() {
  return (
    <View style={styles.root}>
        <Text style={styles.text}>Example Text</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    padding: 100,
    backgroundColor: "rgb(24, 26, 27)",
  },
  text: {
    color: "rgb(255, 163, 26)",
    fontSize: 45,
  },
})

export default App
