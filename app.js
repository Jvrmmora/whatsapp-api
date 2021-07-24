const fs = require('fs')
const ora = require('ora')
const exceljs = require('exceljs')
const cors = require('cors')
const moment = require('moment')
const chalk = require('chalk')
const express = require('express')
const {send} = require('process')

const app = express();

const { Client,MessageMedia } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');


const SESSION_FILE_PATH = './session.json'
let client;
let sessionData;

    app.use(cors())
    app.use(express.urlencoded({extended:true}))

    
    const sendWithApi = (req,res) =>{
        const {facebook,youtube,predicador} = req.body

        var fecha = new Date();
        var options = { year: 'numeric', month: 'long', day: 'numeric' };

        const messageFormat = 
                "🔴Iglesia Adventista Kennedy Digital Culto IASD Kennedy " + fecha.toLocaleDateString("es-ES", options) + " | " + predicador + "\n\n" +
                "• Alabanza"+ "\n" +
                "• Escuela Sabatica" + "\n" +
                "• Anuncios y diezmos" + "\n" +
                "• Oración" + "\n" +
                "• Mensaje \n\n"
                +"*"+predicador+"*"+ "\n\n" +
                "⬇️Da clic en el siguiente enlace:\n"+
                "👉🏼 iglesiaadventistakennedy.org/vivo\n"+
                "📲 Facebook: \n"
                +facebook+ "\n" +
                "📍 YouTube: \n"
                +youtube+ "\n\n" +
                "💡Seamos canal de transmisión COMPARTEME!!!\n\n"+
                "#IASDKennedyBOG\n"+    
                "#IglesiaAdventistaDigitalKennedy\n"+
                "#AVKennedy\n"
        
        const newNumber = `573057046717@c.us`
        sendMessage(newNumber,messageFormat)

        res.send({status: 'Enviado'})
    }

    app.post('/send',sendWithApi)

    const withSession = () => {
        //Si existe cargamos el archivo con las credenciales
        const spinner = ora(`Cargando ${chalk.yellow('Validando session WhatsApp...')}`);
        sessionData = require(SESSION_FILE_PATH);
        spinner.start();
        client = new Client({
            session:sessionData
        });

        client.on('ready', () => {
            console.log('Client is ready!');
            spinner.stop();
            listenMessage()
        });
        
        client.on('auth_failure',() =>{
            spinner.stop();
            console.log('ERROR de autenticacion vuelve a generar QR (Borra el archivo JSON)');
        })

        client.initialize();
    }

    /*/**
    * Esta funcion Genera el QR
    */

    const withOutSession = () =>{
        console.log('No tenemos una sesion guardada')

        client = new Client();

        client.on('qr', qr => {
            qrcode.generate(qr, {small: true});
        });
        
        client.on('authenticated', (session) => {
            //Guardamos las credenciales para luego usarlas
            sessionData = session;
            fs.writeFile(SESSION_FILE_PATH,JSON.stringify(session), (err) => {
                if(err){
                    console.log(err)
                }
            });
        });
        
        client.initialize();
    }

    const listenMessage = () => {
        client.on('message', (msg) => {
            const {from, to, body} = msg;
            //preguntas frequentes
            switch (body) {
                case 'av':
                    sendMessage(from,'Prueba de mensaje')
                    break;
                case 'img':
                    sendMessage(from,'Prueba de Img')
                    sendMedia(from,'img.png')
                    break;
            }
            saveHistorial(from,body)
            console.log(from, to, chalk.yellow(body))
            // console.log(from, to, body)
            
        })
    }
    
    const sendMessage = (to,message) => {
        client.sendMessage(to,message)
    }

    const sendMedia = (to,file) => {
        const mediaFile = MessageMedia.fromFilePath(`./mediaSend/${file}`)
        client.sendMessage(to,mediaFile)
    }

    const saveHistorial = (number,message) => {
        const pathChat = `./chats/${number}.xlsx`
        const workbook = new exceljs.Workbook();
        const today = moment().format('DD-MM-YYYY hh:mm')

        if(fs.existsSync(pathChat)){
            workbook.xlsx.readFile(pathChat)
            .then(() => {
                const worksheet = workbook.getWorksheet(1)
                const lastRow = worksheet.lastRow
                let getRowInsert = worksheet.getRow(++(lastRow.number))
                getRowInsert.getCell('A').value = today;
                getRowInsert.getCell('B').value = message;
                getRowInsert.commit()
                workbook.xlsx.writeFile(pathChat)
                .then(() => {
                    console.log('Historial Actualizado')
                })
                .catch(() => {
                    console.log('No se pudo actualizar')
                })
            })
        }else{
            //CREAMOS
            const worksheet = workbook.addWorksheet('Chats')
            worksheet.columns = [
                {header:'Fecha',key:'date'},
                {header:'Mensaje',key:',message'}
            ]
            worksheet.addRow([today,message])
            workbook.xlsx.writeFile(pathChat)
            .then(() => {
                console.log('Historial creado')
            })
            .catch(() => {
                console.log('Algo Falló')
            })
        }
    }

/**Evalua si ya tengo una sesion*/
(fs.existsSync(SESSION_FILE_PATH)) ? withSession() : withOutSession();

    //Iniciar el server
    app.listen(9000, () =>{
        console.log('🆗 API ESTA ARRIBA! puerto 9000',)
    })