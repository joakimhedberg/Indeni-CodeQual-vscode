############
# Script explanation: 
# w truncates usernames and from. Some devices run an old version of w where this cannot be changed. Using other commands to ensure correct data.
# last also truncates and old version of last don't support -w option 
###########

# user1 pts/0        10.10.1.251      Thu Nov 10 09:34   still logged in
/\[\d+\]/ {
    # Create an array with "terminal" as key and data in format username,from,idle
    split($0,dataSplitArr, "\\] \\[")
    
    terminal=trim(dataSplitArr[5])
    username=trim(dataSplitArr[4])
    from=trim(dataSplitArr[7])
    
    if ( from == "0.0.0.0" ) {
        from="console"
    }
    
    if (terminal != "~" && username != "LOGIN" && username != "") {
        userArray[terminal] = username "," from
    }
}

/start w/ {
    startW=1
}

/\s{1,3}/ {
    
}

# idle tty1  0.03s
/pts|tty/ {
    if (startW == 1) {
        idle=$5
        terminal=$2
        if (terminal in userArray) {
            userArray[terminal] = userArray[terminal] "," idle
        }
    }
}

END {
    for (id in userArray) {
    
        iuser++
        split(userArray[id], valueArray, ",")
        
        users[iuser, "username"]=valueArray[1]
        users[iuser, "from"]=valueArray[2]
        
        users[iuser, "terminal"]=id
        
        # Here we count number of seconds of idle time
        # w uses several time formats
        # DDdays, HH:MMm, MM:SS, SS.CCs
        
        secondsIdle = 0
        # 2days
        if ( valueArray[3] ~ /days/ ) {
            
            split (valueArray[3],idleArrDays,"days")
            secondsIdle=idleArrDays[1] * 86400	

        # 7:13m
        } else if ( valueArray[3] ~ /m/ ) {
            split (valueArray[3],idleArrMin,"m")
            split (idleArrMin[1],idleArrSplit,":")
            secondsIdle = idleArrSplit[1] * 3600 + idleArrSplit[2] * 60

        # 11.00s
        } else if ( valueArray[3] ~ /s/ ) {
            split (valueArray[3],idleArrSec,"\\.")
            secondsIdle = idleArrSec[1]	

        } else if ( valueArray[3] ~ /:/ ) {
            split (valueArray[3],idleArr,":")
            secondsIdle = idleArr[1] * 60 + idleArr[2]
        }

        users[iuser, "idle"]=secondsIdle
    }
   writeComplexMetricObjectArray("logged-in-users", null, users)
}