**FitExplorer Web Application**
-----------------------------------

**Table of Contents**

1. Overview
2. Features
3. Demo
4. Technologies Used
5. API Integration
6. Local Development Setup
7. Deployment (_Prerequisites_ , _Web Server Configuration_,  _GitHub Pages setup_)
8. DOCKER DEPLOYMENT
9. Challenges and Solutions
10. Credits and Acknowledgments
-----------------------------------------------------------------------------------------------------

**1. OVERVIEW**
-------------------------

FitExplorer is a comprehensive web application designed to help fitness enthusiasts discover and learn about over 1,300 exercises. The application provides users with an intuitive interface to search, filter, and explore exercises based on target muscle groups, body parts, and equipment requirements. Each exercise includes high-quality demonstration animations to ensure proper form and technique.

Important Disclaimer: This application is for educational purposes only and should not replace professional fitness guidance. Always consult with a qualified fitness trainer or healthcare provider before starting any exercise program. Proper form and safety should be your top priority.

**2. FEATURES**
------------------------------------------

**2.1 Comprehensive Exercise Database**

- Access to 1,300+ exercises with detailed information
- Categorized by body part, target muscle, and equipment type
- Real-time exercise data from ExerciseDB API


**2.2 Advanced Search and Filtering**

- Multi-criteria search functionality (name, muscle group, equipment, body part)
- Dynamic filtering with instant results
- Sortable exercise lists by various parameters
- Smart search suggestions and auto-complete


**2.3 Interactive Exercise Cards**

- Detailed exercise information display
- Click-to-expand modal views for in-depth exercise details


**2.4 User Experience Features**

- Responsive design optimized for all devices
- Dark/Light theme toggle with system preference detection
- Smooth animations and transitions
- Loading states and error handling
- Accessibility-focused design


**2.5 Educational Resources**

- Built-in "How to Use" guide
- Exercise safety tips and best practices
- Equipment usage recommendations

  
 **3. DEMO**
 --------------------
 **A link to a demo video (demonstrating how to use application locally and how to access it online)** :  https://www.loom.com/share/f94aa310382e403280a177e5f6d1b552?sid=8a69d8c7-916d-4472-89de-8de15842f907
 
 Open this link to access FitExplorer; https://www.yamal.tech 
 
 **4. Technology used:**
 ---------------------------------
 - Frontend:
      -HTML: for structuring a webpage
      -CSS: for styling
      -JavaScripts
- API Interactions:
     - ExerciseDB API from https://rapidapi.com/justin-WFnsXH_t6/api/exercisedb
- Deployment:
    Deployed on nginx on web-01 server and github pages

**5. API INTERACTION**
  -------------------------------------
The application integrates with the ExerciseDB API from RapidAPI to access a comprehensive database of exercises. This API provides:

- Complete exercise information including names, target muscles, body parts, and equipment
- High-quality demonstration GIFs for each exercise
- Structured data for easy filtering and categorization
- Real-time access to the latest exercise database

**API Documentation:** ExerciseDB API Documentation


**6. LOCAL DEVELOPMENT SETUP**
----------------------------------

Follow these steps to set up the project for local development:
 **Step 1**:
  Clone this repo: **FitExplore**.
   by:
   ```
   git clone https://github.com/stevenalu/FitExplore
   ```

   then move inside it by:
   
   ```cd FitExplore ```
   
 **Step 2**:
   OPEN THE PROJECT:
     You can simply open the index.html file in your browser as this is a purely front-end application

**7. DEPLOYMENT**
------------------------------------
**7.1 Prerequisites**

Two web servers **which I just received on 31st july 2025 t 11:50 PM**:
  - **Web-01** and **Web-02** (where nginx is installed, and I configured /etc/nginx/sites_available/default, this file is where I hosted my application for instance: I put all my files used to make application including; HTML, CSS, and JS, all were put inside this /var/www/html so that it can be accessed by visiting the IP_Address)
    
Load balancer:
  -Through **lb-01** (where **haproxy** is installed **to distribute the requests by roundrobin** through those two servers. And those were done through configuring an haproxy config file ( /etc/haproxy/haproxy.cfg ), So you can access it through linking up to the IP_address of this lb-01)
  
**7.2 Domain name**
  - A domain used, was created from DotTech domain (**www.yamal.tech**) where I used to link up with the IP_Address so if you vist my domain you will get the same by visiting via IP_Address.
    
**7.3 SSL certificate**
  -  From lb-01 , I created a certificate using **certbot**, issued by Letsencrypt and signed by it. So, it can be secure as it is.
      Now, this link is secured: https://www.yamal.tech
    
- **GitHub Pages**:
  - Application is also alternatively, deployed on github pages as it's only way it can be deployed with HTTPS because load balancing with my servers couldn't work due to the issues with **web-02 and lb-01** (Link to deployed app on GitHub Pages: https://stevenalu.github.io/fitexplorer/) 
  
**7.2 Domain name**
  - A domain used, was created from DotTech domain where I used to link up with the IP_Address so if you vist my domain you will get the same by visiting via IP_Address.
    

**8. DOCKER DEPLOYMENT**


This section explains how the FitExplorer web application and load balancer are containerized, built, deployed, and tested using Docker.

Docker Hub Image Details
The Docker images are publicly available on my Docker Hub Account https://hub.docker.com/r/stevenalu :

- web-01: https://hub.docker.com/r/stevenalu/fitexplorer-web-01

- web-02: https://hub.docker.com/r/stevenalu/fitexplorer-web-02

- lb-01: https://hub.docker.com/r/stevenalu/fitexplorer-lb-01

Once you are in the root of this repo when you clone it where:

```
https://github.com/waka-man/web_infra_lab
```

Then:

```
docker pull stevenalu/fitexplorer-web-01:latest
docker pull stevenalu/fitexplorer-web-02:latest
docker pull stevenalu/fitexplorer-lb-01:latest
```

**How to Build: Instructions (Local)**
Follow this:
```
docker build -t stevenalu/fitexplorer-web-01:latest -f web/Dockerfile ./web
docker build -t stevenalu/fitexplorer-web-02:latest -f web/Dockerfile ./web
docker build -t stevenalu/fitexplorer-lb-01:latest -f lb/Dockerfile ./lb
```

**Run Instructions (on Web01 & Web02)**
SSHed into each web server and ran:
```
docker pull stevenalu/fitexplorer-web-01:latest  # on web-01
docker pull stevenalu/fitexplorer-web-02:latest  # on web-02

docker run -d --name fitexplorer-web --restart unless-stopped -p 8080:8080 stevenalu/fitexplorer-web-01:latest  # web-01
docker run -d --name fitexplorer-web --restart unless-stopped -p 8080:8080 stevenalu/fitexplorer-web-02:latest  # web-02
```

**Load Balancer Configuration (on lb-01)**
I configured HAProxy (/etc/haproxy/haproxy.cfg) with:
```
global
    daemon
    maxconn 256

defaults
    mode http
    timeout connect 5s
    timeout client  50s
    timeout server  50s

frontend http-in
    bind *:80
    default_backend servers

backend servers
    balance roundrobin
    server web01 172.20.0.11:80 check
    server web02 172.20.0.12:80 check
    http-response set-header X-Served-By %[srv_name]
```

And after i hasd to **reload haproxy** inside lb-01 after SSHed into it:
```
sudo service haproxy restart
```

**Testing steps & evidence**
From my host machine, I repeatedly ran:
```
curl -i http://localhost:8082

```

**Screenshot below shows the live process and demo when FitExplorer application hosted on web-01 running on local machine:**
<img width="1919" height="1079" alt="Screenshot 2025-07-27 001137" src="https://github.com/user-attachments/assets/32715d90-ba7c-4025-8ce1-d20135b81c81" />
<img width="1919" height="1079" alt="image" src="https://github.com/user-attachments/assets/86eacf32-18d3-4eb0-8325-de973fbacd91" />



**9. CHALLENGES AND SOLUTIONS**
-------------------------------------------------
**API Rate Limiting**
     Challenge: RapidAPI imposes request limits on free tier accounts.
     solution: upgrading to a paid plan that could be solution in the future


**10. CREDITS and ACKNOWLEDGEMENT**
----------------------------------------------------

API USED: **ExerciseDB API from RapidAPI**

  https://rapidapi.com/justin-WFnsXH_t6/api/exercisedb
  
  https://edb-docs.up.railway.app/docs/authentication
  
Visit the links above for it's documentation.
    
