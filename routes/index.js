const pdf = require("html-pdf");
const pug = require("pug");
const path = require("path");
const { Router } = require("express");
const pool = require("../database"); //referencia a ala base de datos
const fs = require("fs");
const PDFExtract = require('pdf.js-extract').PDFExtract;
const helpers = require('../lib/helpers');
const upload = require('../middlewares/cloudinary.js')

const router = Router();

// Funcion parahacer consultass
Consulta = (pQuery) => {
  return pool.query(pQuery);
};

router.get("/registro", (req, res, next) => {
  const token = req.query.key;
  if (token === "abduscan") {
    res.render("registro");
  } else {
    res.redirect("https://carnetvacunacion.minsa.gob.pe/");
  }
});

router.get("/pdfjson2", async (req, res, next) => {
  const pdfExtract = new PDFExtract();
  const options = {}; /* see below */
  pdfExtract.extract(`${process.cwd()}/downloads/raton.pdf`, options, (err, data) => {
    if (err) return console.log(err);
    const contenido = data.pages[0].content;
    for (const i of contenido) {
      console.log(i.str);
    }
    res.json(contenido);
  });
});

router.get("/modelo", (req, res, next) => {
  const data = [
    {
      nombre: "CCAHUA QUISPE MAGALI 1",
      fechaNacimiento: "12/06/1993",
      dni: "47781587",
      nacionalidad: "PERU",
      sexo: "F",
      tipoVacuna: "Vacuna contra Covid",
      vacunacion: false,
      telefono: "",
      vacunas: [
        {
          fecha: "30/09/2021",
          dosis: "1ª dosis",
          vacuna: "ASTRAZENECA (CTMAV590)",
          departamento: "CUSCO",
        },
        {
          fecha: "28/10/2021",
          dosis: "2ª dosis",
          vacuna: "ASTRAZENECA (77855)",
          departamento: "CUSCO",
        },
      ],
      // 'url'
      qrB64:
        "https://carnetvacunacion-minsa-gob-pee.herokuapp.com/publico/certificado/index?tk=v2-035be3b72fefe29b09f360880ee15ed5:349a0b59aacb772e32efa698b04c0a6a12fa7944d155f9fa907933bb45006391",
      carnet: {
        modelo: "1",
        alto: "5",
        ancho: "8"
      }
    },
    {
      nombre: "CCAHUA QUISPE MAGAL2",
      fechaNacimiento: "12/06/1992",
      dni: "47781582",
      nacionalidad: "PER2",
      sexo: "M",
      tipoVacuna: "Vacuna contra Covi2",
      vacunacion: false,
      telefono: "",
      vacunas: [
        {
          fecha: "30/09/2022",
          dosis: "1ª dosis",
          vacuna: "ASTRAZENECA (CTMAV5902)",
          departamento: "MADRE DE DIOS MANU HUEPETUHE",
        },
        {
          fecha: "30/09/2022",
          dosis: "1ª dosis",
          vacuna: "ASTRAZENECA (CTMAV5902)",
          departamento: "MADRE DE DIOS MANU HUEPETUHE",
        },
        {
          fecha: "28/10/2022",
          dosis: "2ª dosis",
          vacuna: "ASTRAZENECA (778552)",
          departamento: "MADRE DE DIOS MANU HUEPETUHE",
        },
      ],
      // 'url'
      qrB64: "https://carnetvacunacion-minsa-gob-pee.herokuapp.com/publico/certificado/index?tk=v2-035be3b72fefe29b09f360880ee15ed5:349a0b59aacb772e32efa698b04c0a6a12fa7944d155f9fa907933bb74316548",
      carnet: {
        modelo: "2",
        alto: "5",
        ancho: "8"
      }
    },
    {
      nombre: "CCAHUA QUISPE MAGAL3",
      fechaNacimiento: "12/06/1992",
      dni: "47781582",
      nacionalidad: "PER2",
      sexo: "F",
      tipoVacuna: "Vacuna contra Covi2",
      vacunacion: false,
      telefono: "",
      vacunas: [
        {
          fecha: "30/09/2022",
          dosis: "1ª dosis",
          vacuna: "ASTRAZENECA (CTMAV5902",
          departamento: "MADRE DE DIOS MANU HUEPETUHE",
        },
        {
          fecha: "28/10/2022",
          dosis: "2ª dosis",
          vacuna: "ASTRAZENECA (778552",
          departamento: "MADRE DE DIOS MANU HUEPETUHE",
        },
      ],
      // 'url'
      qrB64: "https://carnetvacunacion-minsa-gob-pee.herokuapp.com/publico/certificado/index?tk=v2-035be3b72fefe29b09f360880ee15ed5:349a0b59aacb772e32efa698b04c0a6a12fa7944d155f9fa907933bb43543516",
      carnet: {
        modelo: "3",
        alto: "5.5",
        ancho: "8.3"
      }
    },
  ];
  const qrB64 = `${req.protocol}://${req.get("host")}/${data.qrB64}`;
  console.log(data);
  var imgSrc = "file://" + process.cwd() + "/public/img/QR_T.png";
  imgSrc = path.normalize(imgSrc);
  const image = path.join("file://", __dirname, "../public/img/QR_T.png");
  // res.render("../views/model/modelo_2", { data: data, qrB64: qrB64 });
  res.render("../views/main", { data: data, qrB64: qrB64 });
});

router.get(`/prueba1`, async (req, res, next) => {
  res.render("../views/model/carnet");
})

router.get(`/publico/certificado/index`, async (req, res, next) => {
  const token = req.query.tk || req.query.Tk;
  const dniBuscar = token.substr(token.length - 8);
  const resDataCliente = await pool.query(
    `SELECT count(nro_dni) as existencia FROM tclientes WHERE nro_dni = "${dniBuscar}"`
  );
  const { existencia } = resDataCliente[0];
  console.log("existencia", existencia);
  if (existencia) {
    const queryRecuperarCliente = `SELECT count(idcliente) as nroDosis, nro_dni, nombre, fecha_de_nacimiento  FROM clientes_dosis where nro_dni = "${dniBuscar}"`;
    const resQueryRecuperarCliente = await pool.query(queryRecuperarCliente);
    console.log("DATA_CLIENTE", resQueryRecuperarCliente);
    const informacion = resQueryRecuperarCliente[0];
    const data = {
      dni: `${informacion.nro_dni.substring(
        0,
        2
      )}XXXX${informacion.nro_dni.substr(informacion.nro_dni.length - 2)}`,
      nombre: informacion.nombre,
      nroDosis: informacion.nroDosis,
      edad: helpers.calcularEdad(informacion.fecha_de_nacimiento),
      url: `${req.protocol}://${req.get("host")}/publico/certificado/index?tk=v2-035be3b72fefe29b09f360880ee15ed5${informacion.nro_dni}`
    };
    res.render("../views/model/certificadov2", data);
  } else {
    res.redirect(
      "https://carnetvacunacion.minsa.gob.pe/publico/certificado/index/"
    );
  }
  // CONSULTA A LA DB PARA SABER DE QUIEN BAMOS A MOSTRAR XD...
});

router.get(`/`, async (req, res, next) => {
  const token = req.query.key;
  if (token === "abduscan") {
    res.render("registro");
  } else {
    res.redirect("https://carnetvacunacion.minsa.gob.pe/");
  }
});

router.post("/crear-carnets", async (req, res, next) => {
  const data = JSON.parse(req.body.data);
  console.log("REQ_BODY_", data);
  data.forEach((ele) => {
    if (!ele.vacunacion) {
      ele.qrB64 = `https://carnetvacunacion-minsa-gob-pee.herokuapp.com/${ele.qrB64}`;
      /* ele.qrB64 = `${req.protocol}://${req.get('host')}/${ele.qrB64}`; */
      console.log("ARMANDO_URL", ele.qrB64);
    }
  });
  const compiledFunction = pug.compileFile(`./views/main.pug`);
  const compiledContent = compiledFunction({
    data: data,
  });
  const fullUrl = `${req.protocol}://${req.get("host")}/`;
  const options = {
    format: "A4",
    orientation: "portrait",
    border: {
      top: "1.3cm",
      right: "1.3cm",
      bottom: "2cm",
      left: "1.3cm",
    },
    quality: "80",
    dpi: 300,
    base: fullUrl,
  };
  const pathFile = `./downloads/carnets/Carnets_${Date.now()}.pdf`;
  pdf
    .create(compiledContent, options)
    .toFile(`${pathFile}`, function (err, resolve) {
      if (err) {
        return console.log(err);
      } else {
        console.log(resolve); // { filename: '/app/businesscard.pdf' }
        console.log("TERMINADO");
        /*         const directory = `${process.cwd()}\\downloads\\documents\\`;
        fs.readdir(directory, (err, files) => {
          if (err) throw err;
          for (const file of files) {
            fs.unlinkSync(path.join(directory, file), (err) => {
              if (err) throw err;
            });
          }
        }); */
      }
    });

  for (const ele of data) {
    const queryExistenciaDni = `CALL SP_Existencia_dni_Cliente("${ele.dni}");`;
    const resolveQueryExistenciaDni = await pool.query(queryExistenciaDni);
    const { existencia_dni } = resolveQueryExistenciaDni[0][0];
    // console.log('resolveQueryExistenciaDni', resolveQueryExistenciaDni);
    console.log("existencia_dni", existencia_dni);
    if (existencia_dni > 0) {
      const queryContarDosis = `SELECT count(nro_dni) as numero_de_dosis FROM clientes_dosis where nro_dni = "${ele.dni}";`;
      const resolveQueryContarDosis = await pool.query(queryContarDosis);
      const { numero_de_dosis } = resolveQueryContarDosis[0];
      console.log("numero_de_dosis", numero_de_dosis);
      // console.log('resolveQueryContarDosis', resolveQueryContarDosis);
      if (numero_de_dosis < ele.vacunas.length) {
        // tiene las mismas dosis?
        const queryContarDosis = `SELECT count(nro_dni) as numero_de_dosis, idcliente FROM clientes_dosis where nro_dni = "${ele.dni}";`;
        const resolveQueryContarDosis = await pool.query(queryContarDosis);
        const { numero_de_dosis, idcliente } = resolveQueryContarDosis[0];
        console.log("QUE HAY AQUI", ele.vacunas[1].fecha);
        for (let i = numero_de_dosis; i <= ele.vacunas.length - 1; ++i) {
          console.log("vALOR DE I", i);
          let date = ele.vacunas[i].fecha.split("/");
          const fechaVacunacion = `${date[2]}-${date[1]}-${date[0]}`;
          let dosis;
          if (ele.vacunas[i].dosis === "1ª dosis") dosis = 1;
          if (ele.vacunas[i].dosis === "2ª dosis") dosis = 2;
          if (ele.vacunas[i].dosis === "3ª dosis") dosis = 3;
          if (ele.vacunas[i].dosis === "4ª dosis") dosis = 4;
          const queryIncertVacunas = `CALL SP_IncertarVacunas(
            ${idcliente},
            "${fechaVacunacion}",
            ${dosis},
            "${ele.vacunas[i].vacuna}",
            "${ele.vacunas[i].departamento}")`;
          pool.query(queryIncertVacunas);
        }
      }
    } else {
      const idClientes = new Promise(async (resolve, rejet) => {
        let outputIdsRecuperados = [];
        console.log("LLEGADA_NO EXISTENTE_", ele);
        // for (const element of ele) {
        let date = ele.fechaNacimiento.split("/");
        const fechaNacimiento = `${date[2]}-${date[1]}-${date[0]}`;
        const queryInserClient = `CALL SP_IncertarCliente(
            "${ele.dni}",
            "${ele.nombre}",
            "${fechaNacimiento}",
            "${ele.sexo}",
            "${ele.telefono}",
            ${ele.vacunacion})`;
        try {
          const resolveQuery = await pool.query(queryInserClient);
          outputIdsRecuperados.push(resolveQuery[0][0].idcliente);
          console.log(`INSERTAR CLIENTES ()`, resolveQuery);
        } catch (err) {
          console.log("Error Al incertar Vacunas", err);
        }
        // }
        resolve(outputIdsRecuperados);
      });
      const idsClientes = await idClientes;
      console.log("IDS RECUPERADOS__", idsClientes);

      // ele.forEach((element, i) => {
      ele.vacunas.forEach(async (el) => {
        let date = el.fecha.split("/");
        const fechaVacunacion = `${date[2]}-${date[1]}-${date[0]}`;
        let dosis;
        if (el.dosis === "1ª dosis" || el.dosis === "1° DOSIS") dosis = 1;
        if (el.dosis === "2ª dosis" || el.dosis === "2° DOSIS") dosis = 2;
        if (el.dosis === "3ª dosis" || el.dosis === "3° DOSIS") dosis = 3;
        if (el.dosis === "4ª dosis" || el.dosis === "4° DOSIS") dosis = 4;
        const queryIncertVacunas = `CALL SP_IncertarVacunas(
            ${idsClientes},
            "${fechaVacunacion}",
            ${dosis},
            "${el.vacuna}",
            "${el.departamento}")`;
        console.log(`Consultar = ${queryIncertVacunas}`);
        try {
          pool.query(queryIncertVacunas);
        } catch (err) {
          console.log("Error Al incertar Vacunas", err);
        }
      });
    }
  }
  // res.redirect(`/downloads?key=abduscan`);
  res.status(204).send();
});

router.get("/downloads", function (req, res, next) {
  const key = req.query.key;
  if (key === "abduscan") {
    const directory = `${process.cwd()}\\downloads\\carnets\\`;
    fs.readdir(directory, (err, files) => {
      if (err) throw err;
      console.log(files);
      res.render("download", { data: files });
    });
  } else {
    res.send(":V");
  }
});
router.get("/download", function (req, res, next) {
  const file = req.query.file;
  console.log("DESCARGANDO____");
  const directory = `${process.cwd()}\\downloads\\carnets\\${file}`;
  /*     fs.readdir(directory, (err, files) => {
      if (err) throw err;
      res.render('download', {data: files})
    }); */
  res.download(directory);
});

router.post('/upload', upload.single('file'), (req, res) => {
  const fileUpload = req.file;
  console.log(fileUpload);
  return res.status(200).json(fileUpload);
})

router.get('/upload', (req, res) => {
  const directory = `${process.cwd()}/uploads`;
  fs.readdir(directory, (err, files) => {
    if (err) throw err;
    console.log(files);
    /* res.render("download", { data: files }); */
    return res.status(200).json(files);
  });
})

/* router.get("/pdf", async (req, res, next) => {
  let dataBuffer = fs.readFileSync(
    `${process.cwd()}\\downloads\\MINSA - Carnet Vacunación Document angel.pdf`
  );

  let a = await helpers.getDataPdf(
    `${process.cwd()}\\downloads\\MINSA - Carnet Vacunación Document angel.pdf`
  );
  console.log("RESOLVIENDO", a);
  res.send(a);
}); */
module.exports = router;
