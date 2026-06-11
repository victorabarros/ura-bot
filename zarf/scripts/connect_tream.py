# https://docs.x.com/x-api/posts/filtered-stream/introduction#connecting-to-the-stream
import requests

def stream_posts(bearer_token):
    url = "https://api.x.com/2/tweets/search/stream"
    headers = {"Authorization": f"Bearer {bearer_token}"}
    
    response = requests.get(url, headers=headers, stream=True)
    
    for line in response.iter_lines():
        if line:
            print(line.decode("utf-8"))

if __name__ == "__main__":
    bearer_token = ""
    stream_posts(bearer_token)
