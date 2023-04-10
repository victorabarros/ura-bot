# UraBotDotNet

## how to run

First run `azurite`

```sh
docker run -p 10000:10000 -p 10001:10001 -p 10002:10002 \
    mcr.microsoft.com/azure-storage/azurite
```

Once is running, test executing

`curl --request POST -H "Content-Type:application/json" --data '{}' http://localhost:7071/admin/functions/UraBot`

<!--

request finhub: `curl 'https://finnhub.io/api/v1/quote?symbol=URA&token=c66u80iad3icr57jne00'`

TODO
twiter sdk https://github.com/linvi/tweetinvi
https://github.dev/linvi/tweetinvi/blob/master/Examples/Examplinvi.ASP.NET.Core/Startup.cs
https://www.youtube.com/watch?v=1maeTudF8cQ
docker image https://github.com/dotnet/dotnet-docker

-->
