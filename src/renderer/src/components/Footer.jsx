import { useState, useEffect } from "react";
import FooterContent from "./FooterContent";
import { MonitorCog, PcCase, Database } from "lucide-react";


export default function Footer({operatingSystem, model, name}){
    const [isReady, setIsReady] = useState(false);

    useEffect(() => {
        if(operatingSystem && model && name){
            setIsReady(true);
        }
    }, [operatingSystem, model, name]);
    return(
        isReady && (  
            <div className="footer">
                <FooterContent icon={<MonitorCog/>} content={operatingSystem} delay={2.5} />
                <FooterContent icon={<PcCase/>} content={model} delay={3} />
                <FooterContent icon={<Database/>} content={name} delay={3.5} />
            </div>
        )
    );
}