# Checks the three variables that are needed to run the container

if [ -z ${data} ] || [ ! -d "$data" ]
then 
    echo "data is unset in .env or is not a directory"
    exit 1
fi
if [ -z ${state} ] || [ ! -d "$state" ]
then 
    echo "state is unset in .env or is not a directory"
    exit 1
fi
[ -z $DPDASH_IMG ] && DPDASH_IMG=dpdash.sif
if [ ! -f $DPDASH_IMG ] && [ ! -d $DPDASH_IMG ]
then
	echo "$DPDASH_IMG cannot be found. Make sure it exists or define DPDASH_IMG properly."
	exit 1
fi