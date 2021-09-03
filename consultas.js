const {
    Pool
} = require('pg')
const pool = new Pool({
    user: 'postgres',
    password: "1234",
    host: "localhost",
    port: 5432,
    database: "skatepark"
})
async function insertar(email, nombre, password2, experiencia, especialidad, name) {
    try {
        const result = await pool.query(`INSERT INTO skaters(email,nombre,password,anos_experiencia,especialidad,foto,estado)
         values('${email}','${nombre}','${password2}',${experiencia},'${especialidad}','${name}',false) RETURNING *;`)
        const registro = result.rows[0]
        return registro

    } catch (error) {
        console.lo(error)
        return error
    }
} 


async function getUsuarios() {
    try {

        const result = await pool.query("SELECT * FROM  skaters ORDER BY id ASC")
        return result.rows
    } catch (error) {
        console.log(error)
        return error;
    }
}

async function setUsuarioEstado(id,estado) {
    
    const result= await pool.query(`UPDATE skaters SET estado=${estado} WHERE id=${id} RETURNING *;`)
    return result.rows[0]
}

async function autenticar(email, password) {   
    const result = await pool.query(`SELECT * FROM skaters WHERE email='${email}'AND password='${password}'`)
    return result.rows[0]
}


module.exports = {
    insertar,
    getUsuarios,setUsuarioEstado, autenticar}