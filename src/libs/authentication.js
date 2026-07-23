const { exec } = require("child_process");

class AuthenticationIncorrectAccountCredentials extends Error{
    constructor(message){
        super(message);
        this.name = "AuthenticationIncorrectAccountCredentials";
    }
}

class AuthenticationInsufficientParametersError extends Error{
    constructor(message){
        super(message);
        this.name = "AuthenticationInsufficientParametersError";
    }
}

class AuthenticationAccessIsDenied extends Error{
    constructor(message){
        super(message);
        this.name = "AuthenticationAccessIsDenied";
    }
}

class AuthenticationFailed extends Error{
    constructor(message){
        super(message);
        this.name = "AuthenticationFailed";
    }
}

class FailedToGetNetworkPrinters extends Error{
    constructor(message){
        super(message);
        this.name = "FailedToGetNetworkPrinters";
    }
}

class Authentication{
    /**
     * authenticateUser: authenticates the user to the print server
     */
    authenticateUser(username, password, print_server){
        this.network_username = username;
        this.network_password = password;
        this.print_server = print_server;
        return new Promise((resolve, reject) => {
            const command = `net use \\\\${this.print_server} /user:${this.network_username} ${this.network_password}`;
    
            exec(command, (error, stdout, stderr) => {
                if(error){
                    console.log("[ERROR]: An Error As Occured");
                    console.log(`\t -> ${error.message}`);
                    if(error.message.toLowerCase().includes("1326")){
                        reject(new AuthenticationIncorrectAccountCredentials("Incorrect Username or Password"));
                        return;
                    }

                    reject(new AuthenticationFailed("General Error Has Occured"));
                    return;
                }
    
                if(stderr){
                    console.log("[ERROR]: An Error Has Occured");
                    console.log(`\t -> ${stderr}`);
                    if(stderr.toLowerCase().includes("1326")){
                        reject(new AuthenticationIncorrectAccountCredentials("Incorrect Username or Password"));
                        return;
                    }
                    reject(new AuthenticationFailed("General Error Has Occured"));
                    return;
                }
    
                resolve("User Authenticated");
            });
        });
    }

    /**
     * deauthenticateUser: Deauthenticates uer from the print server
     */
    deauthenticateUser(){
        return new Promise((resolve, reject) => {
            const command = `net use \\\\${this.print_server} /delete`;
    
            exec(command, (error, stdout, stderr) => {
                if(error){
                    reject("[ERROR]: Failed to deauth the user");
                }
    
                if(stderr){
                    reject("[ERROR]: Failed to deauth the user");
                }
    
                resolve(stdout);
            });
        });      
    }

    /**
     * getNetworkPrinters: Gets the network printers from the print server
     */
    getNetworkPrintersData(){
        return new Promise((resolve, reject) => {
            const command = `net view \\\\${this.print_server}`;
    
            exec(command, (error, stdout, stderr) => {
                if(error){
                    this.deauthenticateUser();
                    reject(FailedToGetNetworkPrinters);
                }
    
                if(stderr){
                    this.deauthenticateUser();
                    reject(FailedToGetNetworkPrinters);
                }
    
                resolve(stdout);
            });
        });
    }

    despawnProcess(processName){
        return new Promise((resolve, reject) => {
            const command = `taskill /IM ${processName}`;
    
            exec(command, (error, stdout, stderr) => {
                if(error){
                    reject(`Error killing process: ${error.message}`);
                }
    
                if(stderr){
                    reject(`Stderr: ${stderr}`);
                }
    
                resolve("Despawned Process");
            })

        })
    }
}

export default Authentication;