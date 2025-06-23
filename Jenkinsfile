pipeline {
    agent { label 'slave' }
    environment {
    registry = "fazelshah/cicd-kube"
    dockercred = "dockerhub"
    TAG = "latest"


    }

    stages {

        stage('pull code') {
          steps{
         git url: 'https://github.com/fazelshah/cicd-deploy-kube.git', branch: 'main'


          }


        }
        stage('build') {
            steps {
            sh 'mvn install -Dskiptest'
            }
        }
        stage('test') {
            steps {
            sh 'mvn test'
            }
        }

         stage('build and push') {
            steps {
            sh 'docker build -t $registry:$TAG .'
            }
        }
    }
}
