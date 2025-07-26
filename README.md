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
8. Challenges and Solutions
9. Credits and Acknowledgments
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
 
 Open this link to access FitExplorer; http://web-01.yamal.tech or http://web-01.yamal.tech/home 
 
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

only one web server:
  - **Web-01** (where nginx is installed, and I configured /etc/nginx/sites_available/default, this file is where I hosted my application for instance: I put all my files used to make application including; HTML, CSS, and JS, all were put inside this /var/www/html so that it can be accessed by simply visiting the IP_Address of web-01)
    
- **GitHub Pages**:
  - Application is also alternatively, deployed on github pages as it's only way it can be deployed with HTTPS because load balancing with my servers couldn't work due to the issues with **web-02 and lb-01** (Link to deployed app on GitHub Pages: https://stevenalu.github.io/fitexplorer/) 
  
**7.2 Domain name**
  - A domain used, was created from DotTech domain where I used to link up with the IP_Address so if you vist my domain you will get the same by visiting via IP_Address.
    

**8. CHALLENGES AND SOLUTIONS**
-------------------------------------------------
**API Rate Limiting**
     Challenge: RapidAPI imposes request limits on free tier accounts.
     solution: upgrading to a paid plan that could be solution in the future

**9. CREDITS and ACKNOWLEDGEMENT**
----------------------------------------------------

API USED: **ExerciseDB API from RapidAPI**

  https://rapidapi.com/justin-WFnsXH_t6/api/exercisedb
  
  https://edb-docs.up.railway.app/docs/authentication
  
Visit the links above for it's documentation.
    
