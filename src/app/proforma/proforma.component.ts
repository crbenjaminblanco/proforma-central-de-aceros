import { Component, OnInit, ElementRef, ViewChildren, QueryList, ViewChild,Input} from '@angular/core';
import Docxtemplater from "docxtemplater";
import PizZip from "pizzip";
import PizZipUtils from "pizzip/utils/index.js";
import { saveAs, FileSaver } from "file-saver";
import * as moment from 'moment';
// ES6 Module
import { initIva, convertDocxToPDFFromFile } from "iva-converter";


//usado para generar el pdf
export async function convertDocxToPDF(
  file: any,
  fileName: string
): Promise<any> {
  // GET YOUR API KEY AT https://app.iva-docs.com/auth/register
  initIva("eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJfaWQiOiI1ZjgyMzE0ZTljYTY5YjAwMjk5NmQxYjYiLCJjcmVhdGVkQXQiOjE2MDIzNjc4MjI2NTUsImlhdCI6MTYwMjM2NzgyMn0.2lMsFkDZdKKUauvWDqZnj0RQ-oam8sEASqv4RqEfTSI");
  // This function returns a Promise that resolved a blob
  const data = await convertDocxToPDFFromFile(file);
  // File saver is a library that starts a download with data in blob format
  await saveAs(data, fileName);
}

function loadFile(url, callback) {
  PizZipUtils.getBinaryContent(url, callback);
}

@Component({
  selector: 'CA-proforma',
  templateUrl: './proforma.component.html',
  styleUrls: ['./proforma.component.scss']
})
export class ProformaComponent implements OnInit {
  numeroLineas:any=[''];
  @ViewChild('numeroProforma') numeroProforma: any; 
  @ViewChild('nombreCliente') nombreCliente: any; 
  @ViewChild('direccionCliente') direccionCliente: any; 
  @ViewChild('telefonoCliente') telefonoCliente: any; 
  @ViewChild('codigoCliente') codigoCliente: any; 
  @ViewChild('descargarPDF') descargarPDF: any;  
  @ViewChildren('formulario') formularios: QueryList<any>;  
  @Input() clienteActual :any;
  arrayObjetos=[];
  IVA=0.13;
  subtotal;
  impVentas;
  descargando=false;
  precioFinal;
  mensajeError;
  constructor() { }

  ngOnInit(): void {

  }
  

  createProforma= () =>{
    let flagPass=this.setObjetos();
    if (this.numeroProforma.nativeElement.value!='' &&  this.nombreCliente.nativeElement.value!=''&&  this.direccionCliente.nativeElement.value!=''&&  this.telefonoCliente.nativeElement.value!=''&&  this.codigoCliente.nativeElement.value!=''){
      if (flagPass)
      {
        this.descargando=true;
        this.descargarPDF.nativeElement.innerHTML='Descargando';
        this.createWord(this.setAttributes());
      }
      else
      {
        alert("Revisa los datos: "+this.mensajeError);
      }
    }
    else if(this.numeroProforma.nativeElement.value==''){
      alert("Falta el numero de proforma");
    }
    else {
      alert("Falta información del cliente");
    }
    }

  addLine=()=>{
    this.numeroLineas.push('');
  }
  deleteItem=(id)=>
  {

    alert('Se elimino el artículo');
    this.numeroLineas.splice(id, 1);
  }

  setObjetos = () =>{
      this.arrayObjetos=[]; //Limpia
      this.subtotal=0; //Limpia el sub total
      this.impVentas =0;
      let arrayFormularios = this.formularios.toArray();
      let booleanOK=true;
      let i =0;
      let objetoTarget;
      while (i<arrayFormularios.length && booleanOK )
      {
        let cantidad=arrayFormularios[i].nativeElement.children[0].children[0].value;
        let precioUnit=arrayFormularios[i].nativeElement.children[4].children[0].value;
        let excento=arrayFormularios[i].nativeElement.children[5].children[0].checked;

        objetoTarget={
          'cantidad': cantidad,
          'codigo': arrayFormularios[i].nativeElement.children[1].children[0].value,
          'descripcion':arrayFormularios[i].nativeElement.children[2].children[0].value,
          'medidas':arrayFormularios[i].nativeElement.children[3].children[0].value,
          'precioUnit': precioUnit,
          'precioTotal': precioUnit*cantidad,
          'Excento': excento
      }

      if ( objetoTarget.precioUnit<0 ||objetoTarget.precioUnit=='' )
      {
        booleanOK=false;
        this.mensajeError="Parece que el precio no es válido en el item #"+(i+1);
      }
      else if ( objetoTarget.cantidad<0 || objetoTarget.cantidad=='')
      {
        booleanOK=false;
        this.mensajeError="Parece que la cantidad no es válida en el item #"+(i+1);
      }

      if (objetoTarget.cantidad=='' && objetoTarget.precioUnit=='' && objetoTarget.codigo=='' && objetoTarget.descripcion=='' && objetoTarget.medidas=='' && objetoTarget.precioUnit==''){
        booleanOK=true;
      }
      else //Si no esta vacío
      {
        this.arrayObjetos.push(objetoTarget);
        /* Calculos para el final*/
        this.subtotal+=objetoTarget.precioTotal;
        if(!excento) //Si no es excento
        {
          this.impVentas+=objetoTarget.precioTotal*this.IVA;
        }
        /*Fin de los calculos*/
      }
      ++i;
    }
     this.precioFinal=this.subtotal+this.impVentas;
      return booleanOK;
  }

    /*Asigna los atributos del word*/
    setAttributes = () => {
      let wordAttributes= {
        nombreCliente: this.nombreCliente.nativeElement.value,
        direccionCliente: this.direccionCliente.nativeElement.value,
        telefonoCliente: this.telefonoCliente.nativeElement.value,
        codigoCliente: this.codigoCliente.nativeElement.value,
        numeroProforma: this.numeroProforma.nativeElement.value,
        lineaTabla: this.arrayObjetos,
        subTotal: this.subtotal,
        impVent: this.impVentas,
        precioFinal: this.precioFinal,
        fecha1: this.createDate(),
        fecha2: moment().format('DD-MM-YYYY'),
        hora: moment().format("hh:mm:ss")

      }
      return wordAttributes;
    }
    
    createDate=()=>
    {
      let meses=["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio","Julio", "Agosto","Setiembre","Octubre", "Noviembre","Diciembre"];
      let numberMonth=parseInt(moment().format('MM'))-1;
      let stringDate= moment().format('DD')+" "+"de ";
      stringDate+= meses[numberMonth];
      stringDate+=" del " + moment().format('YYYY');
      return stringDate;
    }

  
    /*Inicio del script de word para crearlo segun la plantilla y descarga si viene desde el metodo ZIP*/
    createWord = function (myAttributes){ 
     let promise=new Promise((resolve)=>{
      //url cambia de manera local
      loadFile("././assets/templateProforma.docx",(error,content)=>{
        this.wordMainFunction(error,content,myAttributes);
        resolve(true);
     });
    });
      return promise;
    //.descargando=false;
  }

       wordMainFunction =  function (error,content,myAttributes){
        if (error) {
            throw error;
          }
          var zip = new PizZip(content);
          var doc = new Docxtemplater().loadZip(zip);
          doc.setData(myAttributes);
          try {
            // render the document (replace all occurences of {first_name} by John, {last_name} by Doe, ...)
            doc.render();
          } catch (error) {
            // The error thrown here contains additional information when logged with JSON.stringify (it contains a properties object containing all suberrors).
            function replaceErrors(key, value) {
              if (value instanceof Error) {
                return Object.getOwnPropertyNames(value).reduce(function (
                  error,
                  key
                ) {
                  error[key] = value[key];
                  return error;
                },
                {});
              }
              return value;
            }
            console.log(
              JSON.stringify(
                {
                  error: error,
                },
                replaceErrors
              )
            );
    
            if (error.properties && error.properties.errors instanceof Array) {
              const errorMessages = error.properties.errors
                .map(function (error) {
                  return error.properties.explanation;
                })
                .join("\n");
              console.log("errorMessages", errorMessages);
              // errorMessages is a humanly readable message looking like this :
              // 'The tag beginning with "foobar" is unopened'
            }
            throw error;
          }
          var out = doc.getZip().generate({
            type: "blob",
            mimeType:
              "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
          }); //Output the document using Data-URI
            //saveAs(out, "Proforma_"+myAttributes.numeroProforma+".docx"); //Descarga el archivo
            let file = new File([out], "documento.docx", {type: ".docx", lastModified: Date.now()}) //lo convierte en un file
             convertDocxToPDF(file,"Proforma"+myAttributes.numeroProforma+".pdf")
             .then(()=>{this.descargando=false;
              
              this.descargarPDF.nativeElement.innerHTML='Descargar PDF';
            });
      }
    /*Fin del script de word */

}
