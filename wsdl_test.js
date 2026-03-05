const { XMLParser } = require('fast-xml-parser');
const parser = new XMLParser({ ignoreAttributes: false, attributeNamePrefix: '@_', removeNSPrefix: true, parseAttributeValue: false, trimValues: true });
const xml = `<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:vtc="http://mfom.com/vtc">
   <soapenv:Header/>
   <soapenv:Body>
      <vtc:rconsultavtc>
         <header fecha="2025-06-15T10:30:00" version="1.0" versionsender="1.0"/>
         <body resultado="00">
            <vtcservicio matricula="9890-GCF" niftitular="12345678Z" cgprovcontrato="28" cgmunicontrato="079" fcontrato="2025-01-01T00:00:00" cgprovinicio="28" cgmuniinicio="079" direccioninicio="Atocha" fprevistainicio="2025-01-01T10:00:00" ffin="2025-01-01" veraz="S"/>
         </body>
      </vtc:rconsultavtc>
   </soapenv:Body>
</soapenv:Envelope>`;
console.log(JSON.stringify(parser.parse(xml).Envelope.Body.rconsultavtc.body, null, 2));
