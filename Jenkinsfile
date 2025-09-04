pipeline {
    agent any

   

    stages {
        stage('Checkout') {
            steps {
                // Use the correct repository URL and credentials
                git branch: 'main', url: 'https://github.com/Pooja-m-exozen/Newasset.git', credentialsId: 'GithubPAT'
            }
        }

        stage('Build Docker Image') {
            steps {
                script {
                    // Build the Docker image
                    sh 'docker build -t digital_asset_frontend_image .'
                }
            }
        }

        stage('Stop Existing Container') {
            steps {
                script {
                    // Stop and remove the existing container if it exists
                    sh 'docker stop digital_asset_frontend_container || true'
                    sh 'docker rm digital_asset_frontend_container || true'
                }
            }
        }

        stage('Run Docker Container') {
            steps {
                script {
                    // Run the Docker container with volumes for photos and QR codes
                    sh '''
                    docker run -d --name digital_asset_frontend_container -p 5022:3000 \
                      --network bridge \
                      digital_asset_frontend_image
                    '''
                }
            }
        }
    }

    post {
        always {
            // Clean up workspace
            cleanWs()
        }
    }
}