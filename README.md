# orderbackendttech

#Docker guide

Stop the existing Docker container:

bash
Copy code
docker stop my-tanamtech-order
Remove the existing Docker container:

bash
Copy code
docker rm my-tanamtech-order
Build the Docker image:

bash
Copy code
docker build -t tanamtech-order .
Make sure you run this command inside the directory where your Dockerfile is located.

Run the Docker container:

bash
Copy code
docker run -d -p 3000:3000 --name my-tanamtech-order tanamtech-order
This assumes that your application runs on port 3000. Adjust the port mapping accordingly.

Check the logs of the new container:

bash
Copy code
docker logs -f my-tanamtech-order
