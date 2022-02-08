const { Poppler } = require("node-poppler");
const pdf_parse = require("pdf-parse");
const pool = require("../database"); //referencia a ala base de datos
const axios = require("axios");
const pngjs = require("pngjs");
const sharp = require("sharp");
const jsQR = require("jsqr");
const fs = require("fs");

const helpers = {};

helpers.Consulta_Dni = async (pdni) => {
  console.log("Activando Auxiliar");
  try {
    let mi_token =
        "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJlbWFpbCI6ImpnY3VlbGFwQGdtYWlsLmNvbSJ9.t6cDUspkRA3grHKMtlCq1PzTGl2nElvjFHcAIi7QBqc",
      api_url =
        "https://dniruc.apisperu.com/api/v1/dni/" +
        pdni +
        "?token=" +
        mi_token +
        "",
      /*             info_dni   = await fetch(api_url),
            respuesta    = await respuesta.json(); */
      info_dni = await axios(api_url);
    console.log("RESPUESTA_DNI", info_dni.data);
    if (info_dni.hasOwnProperty("message")) {
      console.error("MENSAGE DE ERROR --> ", info_dni);
      return "An error has occurred.";
    } else if (info_dni.data.nombres == "") {
      console.log("DNI INCORRECTO");
      return "An error has occurred.";
    } else {
      // let fullname    = '';
      // fullname    = fullname.concat(info_dni.nombres,' ',info_dni.apellidoPaterno,' ',info_dni.apellidoMaterno);
      // Convertir toda las Iniciales de texto en Mayusculas
      /* String.prototype.capitalize = function () {
        return this.replace(/(?:^|\s)\S/g, function (a) {
          return a.toUpperCase();
        });
      }; */

      // fullname    = (fullname.toLowerCase()).capitalize();
      const data = {
        nombres: info_dni.data.nombres.toUpperCase(),
        apellidoPaterno: info_dni.data.apellidoPaterno.toUpperCase(),
        apellidoMaterno: info_dni.data.apellidoMaterno.toUpperCase(),
      };
      return data;
    }
  } catch (err) {
    console.log("Algo salio mal con la consulta dni ", err);
    return "DESCONECCION";
  }
};

/**
 * @description Extrae Texto entre 2 palabras
 * @returns Array de Vacunas
 */
helpers.betweenText = (
  textoInicial,
  textoFinal,
  separador,
  text,
  typeData,
  cutLeft
) => {
  typeData = typeData || false;
  cutLeft = cutLeft || 0;

  if (typeData) {
    // const replacedText = text.replace(separador,'');
    const regexDDMMYYYY =
      /(?:0[1-9]|[12][0-9]|3[01])\/(?:0[1-9]|1[0-2])\/(?:19\d{2}|20\d{2})/g; // regex para buscar el formato dd/mm/yyyy en un texto
    const arrayText = text.split(separador); // Separamos el texto y convertimos en array [Certificado,Date,Name, .., etc]
    const stringJoin = arrayText.join(""); // Unimos todo en un solo string
    const desdeIndex = stringJoin.indexOf(textoInicial); // establecemos el indice de inicio para cortar el strig por la izquierda
    const hastaIndex = stringJoin.indexOf(textoFinal); // establecemos el indice de inicio para cortar el strig por la derecha
    const stringText = stringJoin.slice(
      desdeIndex + textoInicial.length,
      hastaIndex
    ); // cortamos entre texto (textoInicial.length) paracortar mas la palabra de inicio
    const arrayResto = stringText.split(regexDDMMYYYY); // separamos tomando en cuenta las fechas que hay en el string
    arrayResto.shift(); // eliminamos objeto inicial del array sobrante
    const arrayFechasVacunacion = stringText.match(regexDDMMYYYY); // buscamos en el string las formatos de fechas ['dd/mm/yyyy','dd/mm/yyyy']
    const arrayVacunas = arrayResto.map(
      (element, i) => `${arrayFechasVacunacion[i]}${element}`
    ); // Juntamos las fechas con el resto ['dd/mm/yyyy'+resto,'dd/mm/yyyy'+resto]

    console.log("Vacunas_", arrayVacunas);
    // console.log('expresion__', expresion);
    return arrayVacunas;
  } else {
        console.log("ENTRADA PARA PROSESAR_", text);
    const desde = text.indexOf(textoInicial);
    const hasta = text.indexOf(textoFinal);
    // array or string
    const typeString = text.slice(desde, hasta); // array
        console.log("TEXTO CORTADO_", typeString);
    const stringArray = typeString.split(separador);
        console.log("TEXTO CONVERTIDO EN ARRAY_", stringArray);
    const out = stringArray
      .slice(
        stringArray.length - (stringArray.length - 1),
        stringArray.length - 1
      )
      .join(" ");
    /*     console.log('1°_',stringArray.length - (stringArray.length - 1));
    console.log('2°_',stringArray.length - 1);
    console.log("betweenText__", out); */
    const arrayToString = out.substring(cutLeft); // optional cut
    return arrayToString;
  }
};

helpers.getDataPdf = async function (pdfFile, obj) {
  obj = obj || 0;
  let readPdf = fs.readFileSync(pdfFile);
  console.log("readPdf____", readPdf);
  return new Promise((resolve, error) => {
    pdf_parse(readPdf)
      .then(async function (data) {
        const dataPdf = {};
        dataPdf.nombre = await helpers.betweenText(
          "Nombre / Name",
          "Fecha de Nacimiento / Date",
          "\n",
          data.text
        );
        dataPdf.fechaNacimiento = await helpers.betweenText(
          "birth",
          "Documento de Identidad /",
          "\n",
          data.text
        );
        dataPdf.dni = await helpers.betweenText(
          "document",
          "Nacionalidad / Nationality",
          "\n",
          data.text,
          false,
          5
        );
        dataPdf.nacionalidad = await helpers.betweenText(
          "Nacionalidad / Nationality ",
          "Sexo / Sex  ",
          "\n",
          data.text
        );
        dataPdf.sexo = await helpers.betweenText(
          "Sexo / Sex  ",
          "Vacuna / Vaccine ",
          "\n",
          data.text
        );
        dataPdf.tipoVacuna = await helpers.betweenText(
          "Vacuna / Vaccine ",
          "Vacunado / Vaccinated",
          "\n",
          data.text
        );
        const vacunas = await helpers.betweenText(
          "Place",
          "Copyright © 2021.",
          "\n",
          data.text,
          true
        );
        // Separamos el array con los string de vacunas
        console.log("SALIDA DE VACUNAS", vacunas);
        dataPdf.vacunas = await helpers.getVacunas(vacunas);
        dataPdf.vacunacion = true;
        dataPdf.telefono = obj.telefono;
        dataPdf.qrB64 = await helpers.extractQR64(pdfFile);
        dataPdf.carnet = {
          alto: obj.carnet.alto,
          ancho: obj.carnet.ancho,
        };
        // console.log("DATAPDF__", dataPdf);
        // ELIMINAR PDF CREADO
        resolve(dataPdf);
      })
      .catch((error) => {
        console.log("ERROR AL CONVERTIR PDF_", error);
      });
  });
};

/**
 * @author Jose Cuela
 * @description Extrae la imagen de Qr base64 de un PDF
 * @param {string} pdfFilePath - Archibo Pdf
 */
helpers.extractQR64 = async (pdfFilePath) => {
  const getDate = Date.now();
  const outputFile = `${process.cwd()}\\downloads\\${getDate}`;
  const poppler = new Poppler();

  const optionsPoppler = {
    //firstPageToConvert: 1,
    // lastPageToConvert: 1,
    pngFile: true,
    resolutionXYAxis: 500,
    singleFile: true,
    // cropBox: true,
    // cropHeight: 12,
    // cropWidth: 13,
    // cropXAxis: 300,
    // cropYAxis: 300,
  };

  // guardar el PDF como imagen
  await poppler.pdfToCairo(pdfFilePath, outputFile, optionsPoppler);

  // Leer el archibo png generado por el pdf
  const data = fs.readFileSync(`${outputFile}.png`);
  // console.log("Data__", data);

  // convertir imagen a binario
  const png = pngjs.PNG.sync.read(data);
  // console.log("png__", png);

  // Buscar el Qr en la imagen y retornar la ubicación y dimenciones
  const code = await jsQR(
    Uint8ClampedArray.from(png.data),
    png.width,
    png.height
  );
  console.log('Devolución de Qr', code);
  console.log("Cordenadas del QR", code.location);
  const dimentions = {
    left: Math.round(code.location.topLeftCorner.x),
    top: Math.round(code.location.topLeftCorner.y),
    width: Math.round(
      code.location.topRightCorner.x - code.location.topLeftCorner.x
    ),
    height: Math.round(
      code.location.bottomLeftCorner.y - code.location.topLeftCorner.y
    ),
  };
  return new Promise((resolve, reject) => {
    sharp(`${outputFile}.png`)
      .extract({
        left: dimentions.left,
        top: dimentions.top,
        width: dimentions.width,
        height: dimentions.height,
      })
      .toFile(`${outputFile}_qr.png`, async (err) => {
        if (err) console.log(err);
        const bitmapQR = fs.readFileSync(`${outputFile}_qr.png`);
        let qr64 = await Buffer.from(bitmapQR).toString("base64");
        //await fs.unlinkSync(`${outputFile}_qr.png`);
        //await fs.unlinkSync(`${outputFile}.png`);
        resolve(qr64);
      });
  });
};

helpers.getVacunas = (arrVacunas) => {
  const paso1 = arrVacunas.map(
    (el) =>
      `${el.slice(0, el.indexOf(")") + 1)}-v-${el.slice(el.indexOf(")") + 1)}`
  ); // separar Departamento
  const paso2 = paso1.map((el) => `${el.slice(0, 18)}-v-${el.slice(18)}`); // separar tipo vacuna
  const paso3 = paso2.map((el) => `${el.slice(0, 10)}-v-${el.slice(10)}`); // separar fecha
  const paso4 = paso3.map((el) => el.split("-v-"));
  const vacunasObj = paso4.map((el) => {
    return {
      fecha: el[0],
      dosis: el[1],
      vacuna: el[2],
      departamento: el[3],
    };
  });
  console.log("vacunasObj_", vacunasObj);
  return vacunasObj;
};

helpers.crearUrlClienteNoVacunado = (dni) => {
  return (urlDefault = `publico/certificado/index?tk=v2-035be3b72fefe29b09f360880ee15ed5${dni}`);
/*   return (urlDefault = `publico/certificado/index?tk=v2-035be3b72fefe29b09f360880ee15ed5:349a0b59aacb772e32efa698b04c0a6a12fa7944d155f9fa907933bb${dni}`);
 */};

/**
 *
 * @description Convertir 2013-08-03T02:00:00Z a 03/08/2013
 */
helpers.dateIsoToString = (dateIso) => {
  date = new Date(dateIso);
  year = date.getFullYear();
  month = date.getMonth() + 1;
  dt = date.getDate();

  if (dt < 10) dt = `0${dt}`;
  if (month < 10) month = `0${month}`;

  const newDate = `${dt}/${month}/${year}`;
  console.log("Salida fecha convertida ", newDate);
  return newDate;
};

helpers.generarFechasDeVacunacion = (date, nDosis) => {
  let fechasVacunacion = [];
  //console.log("date", date);
  //console.log("nDosis", nDosis);
  for (let i = 1; i <= nDosis; i++) {
    const dateParts = date.split("/");
    //console.log("date.split_", dateParts);
    const dateObject = new Date(
      parseInt(dateParts[2]),
      parseInt(dateParts[1]) - 1,
      parseInt(dateParts[0])
    );
    const priorDate = dateObject.setDate(dateObject.getDate() - 29 * i);
    //console.log('dateObject.getDate()', dateObject.getDate() - (29 * i));
    const newDate = new Date(priorDate);
    //console.log('priorDate', newDate);
    //console.log(`${date} + 30 dias = ${new Date(newDate).toString()}`); // SAlida date + 30 dias adicionado
    const dd = String(newDate.getDate()).padStart(2, "0");
    const mm = String(newDate.getMonth() + 1).padStart(2, "0"); //January is 0!
    const yyyy = newDate.getFullYear();

    fechasVacunacion.unshift({ fecha: `${dd}/${mm}/${yyyy}` });
    //console.log("REORDENAR_", `${dd}/${mm}/${yyyy}`); // Reordenar
  }
  console.log("fechasVacunacion", fechasVacunacion);
  return fechasVacunacion;
};

module.exports = helpers;
