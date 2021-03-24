const express=require('express');
const sessoion=require('express-session');
const morgan=require('morgan');
const cookieParser=require('cookie-parser');
const nunjucks=require('nunjucks');
const dotenv=require('dotenv');
const path=require('path');
const ColorHash=require('color-hash');

dotenv.config();
const indexRouter=require('./routes');
const webSocket=require('./socket');
const connect=require('./schemas');

const app=express();
app.set('port',process.env.PORT||8005);
app.set('view engine','html');
nunjucks.configure('views',{
    express:app,
    watch:true
});
connect();

const sessionMiddleware=session({
    resave:false,
    saveUninitialized:false,
    secret:process.env.COOKIE_SECRET,
    cookie:{
        httpOnly:true,
        secure:false,
    },
});

app.use(morgan('dev'));
app.use(express.static(path.join(__dirname,'public')));
app.use('/gif',express.static(path.join(__dirname,'uploads')));
app.use(express.json());
app.use(express.urlencoded({extended:false}));
app.use(cookieParser(process.env.COOKIE_SECRET));
app.use(sessionMiddleware);
app.use(sessoion({
    resave:false,
    saveUninitialized:false,
    secret:process.env.COOKIE_SECRET,
    cookie:{
        httpOnly:true,
        secure:false,
    }
}));

app.use((req,res,next)=>{
    if(!req.session.color){
        const ColorHash=new ColorHash();
        req.session.color=ColorHash.hex(req.session);
    }
    next();
})


app.use('/',indexRouter);

app.use((req,res,next)=>{
    const error=new Error(`${req.method} ${req.url}라우터가 없습니다`);
    error.status=404;
    next(error);
});

app.use((err,req,res,next)=>{
    res.locals.message=err.message;
    res.locals.error=process.env.NODE_ENV!=='production'?err:{};
    res.render('error');
});

const server=app.listen(app.get('port'),()=>{
    console.log(app.get('port'),'번포트에서 대기 중');
});

webSocket(server,app,sessionMiddleware);