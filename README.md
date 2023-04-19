# Malara App (Back-End)

This project was bootstrapped with Expo. For more information, please refer to [Expo docs](https://docs.expo.dev/)

This is the back end of the Malaria App. A front-end is also needed for this project. Please download [Malaria's front end](https://github.com/lunatoys123/Malaria.git) as well and
check out the README.md

## Component needed
ngrok is needed for connected to back-end

Download link: https://ngrok.com/ and use this tool to connect to port 4000


## Installation step
1. copy this Repo \
    `git clone https://github.com/lunatoys123/Malaria-Server.git`
2. Open the download Repo and run \
    `npm install`
3. Run Ngrok and connect to port 4000
4. Add.env file inside the Repo and add this line under the .env file \
      mail_pass={Password for smtp potocol of your gmail account} \
      DBURL={URL of MONGO DB} \
      Redis_host={URL of Redis} \
      Redis_pass={Redis password} 
5. run `npm run local`


