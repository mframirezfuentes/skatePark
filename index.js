const express = require('express')
const app = express()
const expressFileUpload = require('express-fileupload')
const exphbs = require("express-handlebars")
const bodyParser = require('body-parser')
const jwt = require('jsonwebtoken')
const secretKey = "Silencio"
const {
    insertar,
    getUsuarios,
    setUsuarioEstado,
    autenticar,
    modificar,
    eliminar,
} = require('./consultas')

//Inicio del servidor
app.listen(3000, () => console.log("Servidor 3000 encendido"))


//Accesibilidad a las carpetas
app.use(bodyParser.urlencoded({
    extended: true
}))
app.use(bodyParser.json())
app.use(express.static("public"))
app.use(expressFileUpload({
    limits: {
        fileSize: 5000000
    },
    abortOnLimit: true,
    responseOnLimit: `El peso del archivo que intenta subir supera el limite`
}))
app.use("/css", express.static(__dirname + "/node_modules/bootstrap/dist/css"))
app.use("/jquery", express.static(__dirname + "/node_modules/jquery/dist"))
app.use("/img", express.static(__dirname + "/img"))
app.use("/css", express.static(__dirname + "/css"))
app.engine("handlebars",
    exphbs({
        defaultLayout: "main",
        layoutsDir: `${__dirname}/views/componentes`
    }))
app.set("view engine", "handlebars")

//cuando inicia el servidor, va al index
app.get("/", (req, res) => {
    res.render("index")
})
app.get("/registro", (req, res) => {
    res.render("registro")
})
//cuando se consulta la página login
app.get("/login", async (req, res) => {
    res.render("login")
})
//cuando se consulta la pagina registros
app.get("/ingresos", async (req, res) => {
    const registros = await getUsuarios()
    res.send(registros)
})
//cuando va a la página de administrador
app.get("/admin", async (req, res) => {
    try {
        const usuarios = await getUsuarios()
        res.render("admin", {
            usuarios
        })
    } catch (e) {
        res.status(500).send({
            error: `Algo salió mal ${e}`,
            code: 500
        })
    }
})
//da el pase para setear el estado del usuario
app.put("/usuarios", async (req, res) => {
    const {
        id,
        estado
    } = req.body
    try {
        const usuario = await setUsuarioEstado(id, estado)
        res.status(200).send(JSON.stringify(usuario))
    } catch (e) {
        res.status(500).send({
            error: `Algo salio mal ${e}`,
            code: 500
        })
    }
})

//Ingrese un usuario Skater a la base de datos junto a su fotografía
app.post("/usuario", async (req, res) => {
    if (Object.keys(req.files).length == 0) {
        return res.status(400).send("No se encuentra ningun archivo")
    }
    let {
        fotoPerfil
    } = req.files
    let {
        name
    } = fotoPerfil
    fotoPerfil.mv(`${__dirname}/public/img/${name}`, (err) => {
        if (err) return res.status(500).send({
            error: `algo salio mal ${err}`,
            code: 500
        })

    })
    let {
        email,
        nombre,
        password2,
        experiencia,
        especialidad
    } = req.body
    try {

        const registro = await insertar(email, nombre, password2, experiencia, especialidad, name)
        res.status(201).render("login")


    } catch (error) {
        res.status(500).send({
            error: `Algo salio mal... ${error}`,
            code: 500
        })
    }
})
//Valida que el usuario y contraseña sean los correctos
app.post("/autenticar", async function (req, res) {
    const {
        email,
        password
    } = req.body
    const user = await autenticar(email, password)
    if (user.email) {
        if (user.estado) {
            const token = jwt.sign({
                    exp: Math.floor(Date.now() / 1000) + 180,
                    data: user
                },
                secretKey
            );
            res.send(token)
        } else {
            res.status(401).send({
                error: "Este usuario aún no ha sido verificado",
                code: 401
            })
        }
    } else {
        res.status(404).send({
            error: "Este usuario no esta registrado en la base de datos",
            code: 404
        })
    }
})

app.get(`/datos`, function (req, res) {
    const {
        token
    } = req.query
    jwt.verify(token, secretKey, (err, decode) => {
        const {
            data
        } = decode
        const {
            id,
            email,
            nombre,
            password,
            especialidad,
            anos_experiencia
        } = data
        err ?
            res.status(401).send(
                res.send({
                    error: "401 No autorizado",
                    message: "Usted no esta autorizado para entrar en esta página",
                    token_error: err.message

                })
            ) :
            res.render("datos", {
                id,
                email,
                nombre,
                password,
                especialidad,
                anos_experiencia
            })
    })
})
app.put("/modificar", async (req, res) => {
    const {
        id,
        nombre,
        password1,
        experiencia,
        especialidad
    } = req.body

    try {
        const resultado = await modificar(id, nombre, password1, experiencia, especialidad)
        res.status(200).render("index")

    } catch (e) {
        res.status(500).send({
            error: `Algo salio mal ${e}`,
            code: 500
        })
    }
})
 app.delete("/delete", async (req, res) => {   
    let {id} = req.body.source
 
  try { 
        const registro = await eliminar(id)
        res.status(200).render("index")
        
    }  catch (e) {
        res.status(500).send({
            error: `Algo salio mal ${e}`,
            code: 500
        })
    } 
}) 

app.get("*", (req, res) => {
    res.send("Ruta invalida")
})