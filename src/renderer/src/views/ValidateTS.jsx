import { useState, useEffect, useRef } from "react";
import { LinearProgress } from "@mui/material";
import { motion, AnimatePresence} from "framer-motion";
import Footer from "../components/Footer";
import Printers from "./Printers";

export default function ValidateTS() {
  const[isValidating, setIsValidating] = useState(true);
  const [systemModel, setSystemModel] = useState();
  const [computerName, setComputerName] = useState();
  const [currentStep, setCurrentStep] = useState("Validating Task Sequence");
  const [currentStepNumber, setCurrentStepNumber] = useState();
  const [maxStepNumber, setCurrentMaxStepNumber] = useState();
  const [isMulticasting, setIsMulticasting] = useState(false);
  const [multicastProgress, setMulticastProgress] = useState(0);
  const[showPrinter, setShowPrinter] = useState(false);
  

  function updateDeploymentInformation(){
    if(!isValidating){
      window.api.send("get-deployment-information");
  
      window.api.receive("deployment-information", (data) => {
        setIsMulticasting(data.isMulticast);
        setMulticastProgress(parseInt(data.multicastProgress, 10));
        setCurrentStep(data.currentAction);
      });
    }
  }

  useEffect(() => {
    // Update the deployment on Printers.jsx unmount
    if(!isValidating){
      updateDeploymentInformation()
    }
  }, [isValidating]);
  
  useEffect(() => {
    const intervalID = setInterval(() => {
      if(!isValidating){
        window.api.send("get-deployment-information");
      }
    }, 500);
    

    return () => {
      clearInterval(intervalID);
      window.api.removeListener("deployment-information", () => {});
    }
  }, [currentStep]);
  
  useEffect(() => {
    if(currentStep == "Validating Task Sequence"){
      setTimeout(() => {
        setCurrentStep("Getting System Information")
      }, 500);
    }
    if(currentStep == "Getting System Information"){
      // setShowPrinter(true);
      window.api.send("get-system-info");

      window.api.receive("system-info-data", (data) => {
        if(!data.error){
          console.log("System Information: " + data);
          if(data.manufacturer == "Dell Inc."){
            setSystemModel(`Dell ${data.model}`);
            setComputerName(data.OSDComputerName);
          } else {
            const manufacturer = data.manufacturer.toString().charAt(0).toUpperCase() + data.manufacturer.toString().slice(1).toLowerCase();
            setSystemModel(`${manufacturer} ${data.version}`);
            setComputerName(data.OSDComputerName);
          }
          setTimeout(() => {
            setIsValidating(false); // Validation Is Complete!
          }, 1500);
        }
      });
    }

    if(currentStep == "TSProgressUI-Printer-UI"){
      setShowPrinter(true);
    }

    return () => {
      window.api.removeListener("system-info-data", () => {});
    }
  }, [currentStep]);

  const _viewOnExit = async () => {
    setShowPrinter(false);
    setIsValidating(false);
  }
  
  return (
    <div className="ValidateTS">
      {showPrinter && <Printers onExit={_viewOnExit} OSDComputerName={computerName}/>}
      <div className="view">
        <AnimatePresence mode="wait">
          <motion.h1 
          key={currentStep} 
          initial={{opacity: 0}} 
          animate={{opacity: 1}} 
          transition={{duration: 1, ease:"easeInOut"}} 
          exit={{opacity: 0}} className="validation-status">
            {isMulticasting ? `Downloading Image: ${multicastProgress}%` : currentStep}
          </motion.h1>
        </AnimatePresence>
        <LinearProgress variant={isMulticasting ? "determinate" : "indeterminate"} value={isMulticasting ? multicastProgress : 0} className="validation-progress-bar" />
      </div>
      <Footer operatingSystem={"Windows 11"} model={systemModel} name={computerName}/>
    </div>
  );
}