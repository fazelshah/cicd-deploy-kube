pipeline {
    agent { label 'slave' }

    environment {
        registry = "fazelshah/cicd-kube"
        dockercred = "dockerhub"
        TAG = "latest"
    }

    stages {

        stage('pull code') {
            steps {
                git url: 'https://github.com/fazelshah/cicd-deploy-kube.git', branch: 'main'
            }
        }

        stage('build') {
            steps {
                sh 'mvn install -DskipTests'
            }
        }

        stage('test') {
            steps {
                sh 'mvn test'
            }
        }

        stage('Build and Push') {
            steps {
                sh 'docker build -t $registry:$TAG .'
                sh 'docker push $registry:$TAG'
            }
        }

        stage('Deploy on Kubernetes') {
            steps {
                withKubeConfig([credentialsId: 'kubeconfig']) {
                    sh '''
                        cd kubernetes/deploy
                        kubectl apply -f .
                    '''
                }
            }
        }
    }
}
