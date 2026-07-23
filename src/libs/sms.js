const winax = require("winax");
const systemInformation = require("systeminformation");

class NTSEnvironment{
    constructor(){
        this.isComObjectConnected = false;
        try{
            this.EnvironmentVariable = {};
            this.tsEnvironment = new ActiveXObject("Microsoft.SMS.TSEnvironment");
            this.__getVariables();
            this.isComObjectConnected = true;
        } catch(error){
            console.log(error);
            this.isComObjectConnected = false;
        }
    }

    isComObject(){
        return this.isComObjectConnected;
    }

    getSystemInformation(){
        return new Promise((resolve, reject) => {
            try{
                systemInformation.system().then(data => {
                    let systemInformationString = "";
                    if(data.manufacturer == "Dell Inc."){
                        systemInformationString = `Dell ${data.model}`;
                        console.log(data)
                        resolve(systemInformationString);
                    } else {
                        systemInformationString = `${data.manufacturer.charAt(0).toUpperCase()+data.manufacturer.slice(1)} ${data.version}`;
                        console.log(data)
                        resolve(systemInformationString);
                    }
                    console.log(data)
                    resolve(systemInformationString);
                })
            } catch(error) {
                reject(error);
            }
        })
    }

    getDeploymentInformation(){
        return new Promise((resolve, reject) => {
            try{
                const deploymentInformation = {"taskSequenceID": "", "taskSequenceName": "", "computerName": "", "systemInformation": ""};
                deploymentInformation.taskSequenceID = this.tsEnvironment.Value("TASKSEQUENCEID");
                deploymentInformation.taskSequenceName = this.tsEnvironment.Value("TASKSEQUENCENAME");
                deploymentInformation.computerName = this.tsEnvironment.Value("OSDComputerName");

                systemInformation.system().then(data => {
                    const systemInformationString = `${data.manufacturer.charAt(0).toUpperCase()+data.manufacturer.slice(1).toLowerCase()} ${data.version}`;
                    deploymentInformation.systemInformation = systemInformationString;
                    resolve(deploymentInformation);
                })
                
            } catch (error){
                reject(error)
            }
        });
    }

    getDeploymentStatus(){
        return new Promise((resolve, reject) => {
            const deploymentStatus = {"currentAction": "", "currentIndex": 0, "maxIndex": 0, "isMulticast": false, "multicastProgress": 0, "deployRoot": "", "OSDComputerName": ""};
            deploymentStatus.currentAction = this.tsEnvironment.Value("_SMSTSCurrentActionName");
            deploymentStatus.currentIndex = this.tsEnvironment.Value("_SMSTSNextInstructionPointer");
            deploymentStatus.maxIndex = this.tsEnvironment.Value("_SMSTSInstructionTableSize");
            deploymentStatus.multicastProgress = this.tsEnvironment.Value("MULTICASTPROGRESS");
            deploymentStatus.deployRoot = this.tsEnvironment.Value("DeployRoot");
            deploymentStatus.OSDComputerName = this.tsEnvironment.Value("OSDComputerName");
    
            if (deploymentStatus.multicastProgress != "" && deploymentStatus.currentAction == "Install Operating System"){
                deploymentStatus.isMulticast = true;
            }

            if(deploymentStatus.isMulticast && parseInt(deploymentStatus.multicastProgress, 10) >= 95){
                deploymentStatus.isMulticast = false;
            }
    
            resolve(deploymentStatus);
        })
    }

    getUserPasswordValue(){
        return this.tsEnvironment.Value("USERPASSWORD");
    }

    __getVariables(){
        this.tsEnvironment.GetVariables().forEach(variable => {
            if(variable != "_SMSTSTaskSequence"){
                var value = this.tsEnvironment.Value(variable);
                this.EnvironmentVariable[variable] = value;
                console.log(`${variable} = ${value}`);
            }
        })
    }
}

export default NTSEnvironment;