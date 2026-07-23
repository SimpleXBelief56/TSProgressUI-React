class Printer{
    constructor(){
        this.printerData = [];
        this.currentPrinterData = {};
    }

    getNetworkPrinters(printerData){
        this.printerData = printerData;

        if(this.printerData == undefined){
            throw new TypeError("Printer Data cannot be undefined");
        }

        const lines = this.printerData.trim().split("\n").map(line => line.replace(/\r/g, ""));
        const filteredLines = lines.slice(4);
        filteredLines.splice(2, 1);
        filteredLines.splice(1, 1)
        filteredLines[0] = filteredLines[0].replace("Share name", "ShareName").replace("Used as", "");
        const headers = filteredLines[0].trim().split(/\s+/);
        
        const data = filteredLines.slice(1).map(line => {
            const values = line.trim().split(/\s{2,}/);
            let obj = {};
            headers.forEach((header, index) => {
                obj[header] = values[index];
            });
            return obj;
        });
        const networkPrinters = [];
        data.forEach(printer => {
            if(printer.Type == "Print"){
                networkPrinters.push(printer.ShareName);
                this.currentPrinterData[printer.ShareName] = {isChecked: false};
            }
        })

        return networkPrinters;
    }   

}

export default Printer;