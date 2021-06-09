if [ -f .env ]
then
    export $(cat .env | sed 's/#.*//g' | xargs)
else
    echo ".env cannot be found. Please create an .env file in this directory based on .env.sample."
    exit 1
fi