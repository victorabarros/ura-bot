# UraBotDotNet

## how to run

First run `azurite`

```sh
docker run -p 10000:10000 -p 10001:10001 -p 10002:10002 \
    mcr.microsoft.com/azure-storage/azurite
```

Once is running, test executing

`curl --request POST -H "Content-Type:application/json" --data '{}' http://localhost:7071/admin/functions/UraBot`
