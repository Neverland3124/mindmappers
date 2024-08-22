# Deploy with Kubernetes

## Preparations
### Secrets
- for ghcr download image
  - .dockerconfigjson
- for postgresql
  - DATABASE_USER / DATABASE_PASSWORD
- for Google Oauth2
  - REDIRECT_URL / GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET
- for send email and webhook (which this microservice version not working due to trial version)
  - MAILERSEND_API_KEY
- for generate ai image
  - OPENAI_API_KEY
- for aws image store
  - AWS_ACCESS_KEY_ID / AWS_SECRET_ACCESS_KEY / AWS_REGION / AWS_BUCKET_NAME

## Notes
### Kubectl
- some commands to use
```shell
# suggest set some alias
alias kc="kubectl"
alias kd="kubectl delete -f "
alias ka="kubectl apply -f "
alias kg="kubectl get all "
alias kl="kubectl logs "

# apply file
ka 00-xxx
ka 15-xxx

# delete file
kd 00-xxx
kd 15-xxx

# check all pods
kubectl get all

# check ingress or certificate
kubectl describe ingress mindmappers-ingress
# requires cmctl
cmctl status certificate web-ssl
```
### GKE
- I run the project on Google Kubernetes Engine
#### Certificate and Ingress
- So I start with using GCE with Google managed certificate and found that it seems not possible to set CORS policies (didn't find out a workable solution)
- Therefore I change to use Nginx-Ingress and found out it seems cannot work with Google Mangaged certificate so I finally choose to use Let's Encrypt certificate. [Link](https://cert-manager.io/docs/tutorials/getting-started-with-cert-manager-on-google-kubernetes-engine-using-lets-encrypt-for-ingress-ssl/#troubleshooting)
- Follow the link it have two version of cert `production` and `staging` so there are two cert file

#### Limitation
- Due to the limitation of GKE resources, the postgresdb-sts I only use one to represent the original three different database that microservices each connected to

### Sealed Secret
- can use `kubeseal` [Link](https://github.com/bitnami-labs/sealed-secrets) to encrypt the secret to store the secret on git, but it's not that necessary, i just choose to include secrete file on gitignore
  - To use `kubeseal`, need install it, generate cert file, generate sealed secrete file and use the cert on remote kubernetes engines to decrypt the file

### Helm
- the package manager of kubernetes, I use some of the commands to install controllers but didn't fully utilized the charts feature and other features due to limited time

### Learning video
- I found this series of Youtube Video [Link](https://www.youtube.com/playlist?list=PLrMP04WSdCjrkNYSFvFeiHrfpsSVDFMDR) very helpful for anyone who also want to learn kubernetes
