import { useState, useEffect, useRef } from "react";
import { ToastContainer, toast } from "react-toastify";
import 'react-toastify/dist/ReactToastify.css';

class PrinterDict{
  constructor(printerData){
    if(typeof printerData === "string"){
      printerData = JSON.parse(printerData);
    }

    this.printers = printerData;
    this.printerDict = [];
    this.printers.map(printer => {
      const printerObject = {"name": printer, "isChecked": false};
      this.printerDict.push(printerObject);
    });

    console.log(this.printerDict);
  }

  checkedPrinter(printerName, checked) {
    this.printerDict = this.printerDict.map((printer) =>
      printer.name === printerName ? { ...printer, isChecked: checked } : printer
    );
  }

  getPrintersDict(){
    return this.printerDict;
  }

  getPrinters(name){
    const printerResults = [];
    this.printerDict.map(printer => {
      if(printer.name.toLocaleLowerCase().includes(name.toLocaleLowerCase())){
        printerResults.push(printer);
      }
    });

    return printerResults;
  }

  getCheckedPrinters(){
    const checkedPrinters = [];
    this.printerDict.map(printer => {
      if(printer.isChecked){
        checkedPrinters.push(printer.name);
      }
    });

    return checkedPrinters;
  }

}

export default function Printers({onExit, OSDComputerName}){
  const printServers = [
    { "school": "SCHOOL", "server": "SERVER" },
    { "school": "SCHOOL",  "server":"SERVER" },
    { "school": "SCHOOL", "server": "SERVER" },
    { "school": "SCHOOL", "server": "SERVER" },
    { "school": "SCHOOL", "server": "SERVER" },
    { "school": "SCHOOL", "server": "SERVER" },
    { "school": "SCHOOL", "server": "SERVER" },
    { "school": "SCHOOL", "server": "SERVER" },
  ];

  const [isAuthenticating, setAuthenticationBool] = useState(false);
  const [showPrinterSelection, setPrinterSelectionViewBool] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [printerDictState, setPrinterDictState] = useState([]); // State for rendering
  const [searchTerm, setSearchTerm] = useState("");
  const [networkPrintServer, setPrintServer] = useState("");
  const [suggestedPrintServer, setSuggestedPrintServer] = useState(printServers.find(a => a.school == OSDComputerName?.split("-")[0].toUpperCase().slice(0, 3))?.server || '');
  const networkPrinters = useRef([]);
  const printerDict = useRef(null);



  useEffect(() => {

    const onProcDespawn = () => {
      exitView();
    }

    const onPrinterDictionarySaved = () => {
      exitView();
    }

    window.api.receive("printers-proc-despawned", onProcDespawn);
    window.api.receive("printer-dictionary-saved", onPrinterDictionarySaved);

    return () => {
      window.api.removeListener("printers-proc-despawned", onProcDespawn);
      window.api.removeListener("printer-dictionary-saved", onPrinterDictionarySaved);
    }
  }, [onExit]);

  useEffect(() => {
    if(showToast){
      showToastNotification();
    }
  }, [showToast]);

  const exitView = () => {
    if(onExit){
      onExit();
    }
  }

  const exitHandler = () => {
    window.api.send("printers-ready-to-despawn");
  }

  const showToastNotification = () => {
    if(!toast.isActive("authentication-failed")){
      toast.error("Incorrect Username Or Password", {position: "top-right", toastId: "authentication-failed"});
    }
  }

  const printerSearchHandler = (event) => {
    console.log("Typing......");
    setSearchTerm(event.target.value);
    if(printerDict.current){
      const printersResult = printerDict.current.getPrinters(event.target.value);
      console.log(printersResult);
      setPrinterDictState(printersResult);
    } else {
      console.warn("PrinterDict is not initialized yet");
    }
  }

  const savePrintersHandler = (event) => {
    console.log("Ready to save printer dictionary.....");
    const checkedPrinters = printerDict.current.getCheckedPrinters();
    const selectedPrinters = [];
    checkedPrinters.map(printer => {
      selectedPrinters.push(`\\\\${networkPrintServer}\\${printer}`);
    })
    window.api.send("save-selected-printers", {"printers": selectedPrinters});
  }

  const checkBoxHandler = (event) => {
    console.log("Checkbox State Changed -> " + event.target.checked);
    printerDict.current.checkedPrinter(event.target.value, event.target.checked);
    setPrinterDictState([...printerDict.current.getPrinters(searchTerm)]);
  }

  

  const setSelectedPrintServer = (e) => {
    // Pre-Select Print Server Based On Computer Name
    setSuggestedPrintServer(e.target.value);
  }

  const getNetworkPrinters = () => {
    const username = document.querySelector(".usernamefield").value;
    const password = document.querySelector(".passwordfield").value;
    const printServer = document.querySelector(".serveroptions").value;
    setAuthenticationBool(true);
    window.api.send("get-printers", {username: username, password: password, printServer: printServer});

    window.api.receive("printers-data", (data) => {
      setPrintServer(printServer);
      setAuthenticationBool(false);
      networkPrinters.current = data;
      printerDict.current = new PrinterDict(networkPrinters.current);
      setPrinterDictState(printerDict.current.getPrintersDict());
      setPrinterSelectionViewBool(true);
    });

    window.api.receive("printers-error-data", () => {
      setAuthenticationBool(false);
    });

    window.api.receive("printers-authentication-error", () => {
      console.log("Incorrect Username/Password");
      showToastNotification();
      setAuthenticationBool(false);
    });

  }

  return(
    <div className="PrinterView">
      <ToastContainer/>
      <div className={`LoginView ${showPrinterSelection ? "hideview" : "active"}`}>
        <h1 className="printer-view-title">NodePrintUI</h1>
        <p className="input-label usernamefieldlabel">Username:</p>
        <input id="usernamefield" className="usernamefield"></input>
        <p className="input-label passwordfieldlabel">Password:</p>
        <input type="password" id="passwordfield" className="passwordfield"></input>
        <p className="input-label serverfieldlabel">Print Server:</p>
        <select className="serveroptions" value={suggestedPrintServer} onChange={setSelectedPrintServer}>
          {printServers.map(server => (
            <option key={server.server} value={server.server}>{server.school}</option>
          ))}
        </select>
        <div className="button-group">
          <a className="button cancel-button" onClick={exitHandler}>Cancel</a>
          <a className="button login-button" onClick={getNetworkPrinters} >{isAuthenticating ? (<div className="spinner"></div>) : ( "Login" )}</a>
        </div>
      </div>
      <div className= {`PrinterSelectionView ${showPrinterSelection ? "active" : "hideview"}`}>
        <h1>Select Printers:</h1>
        <div className="printerSelectionGroup">
          <input className="search-printer-field" onInput={printerSearchHandler} placeholder=""></input>
          <div className="printersList">
            {showPrinterSelection &&
            printerDictState.map((printer, index) => (
              <div key={index} className="checkbox-item">
                <input type="checkbox" id="checkox" value={printer.name} onChange={checkBoxHandler} checked={printer.isChecked}></input>
                <label htmlFor="checkbox">{printer.name}</label>
              </div>
            ))
            }            
          </div>
          <div className="printers-button-group">
            <a className="cancel-printers-button printers-button no-highlight" onClick={exitHandler}>Cancel</a>
            <a className="submit-printers-button printers-button no-highlight" onClick={savePrintersHandler}>Submit</a>
          </div>
        </div>
      </div>
    </div>
  )
}