
const Web3 = require('web3');
const net = require('net');
const http = require('http');
const express= require('express');

var Tx = require('ethereumjs-tx');
var bodyParser = require('body-parser');
var urlencodedParser = bodyParser.urlencoded({ extended: false });
var app = express();
const max = 60
const web3 = new Web3('http://127.0.0.1:7545');


var account_pub = "0x9CbaE8f72316549cad286e201A2640441B67c4ed";
var account_priv = Buffer.from("6675c59afd0de3a2fe8e5b05fdf4d1f31884608fac93c4249eb404c042dac6ce",'hex');


var urne = "0xf84182E9eFD7270c45De00C6D13c0B7816f9f0C9";

var keys = generateKey();

console.log(keys);
function vote(candidat){
	if(account_pub != null){
		 web3.eth.getBalance(account_pub,function(err,qte){
			 if(qte >=1){
				 console.log("Vote : ",candidat)
				 const vote = encrypte(keys,candidat);
				 console.log(vote)
				 console.log(decrypte(keys,vote.C1,vote.C2));
				 web3.eth.getTransactionCount(account_pub,(err,tCount)=>{
					 //On créer la transaction
					 var trans = {
						 nonce : web3.utils.toHex(tCount),
						 to : urne,
						 value : web3.utils.toHex(web3.utils.toWei('1','ether')),
						 gas: web3.utils.toHex('1000000'),
						 gasPrice : web3.utils.toHex(web3.utils.toWei('10','gwei')),
						 //On insère pour qui il a voté
						 data : web3.utils.toHex(vote.C1,":",vote.C2)
					 }

					 //On signe la transaction
					 const tx = new Tx(trans);
					 tx.sign(account_priv);



					 //On la sérialise
					 var serTrans = tx.serialize();
					 serTrans = "0x"+serTrans.toString('hex');

					 //On l'envoi
					 web3.eth.sendSignedTransaction(serTrans,(err,num)=>{

					 })
				 });
			 }
		});
	}
}


app.get('/',function(req,res){
	res.render('login.ejs');
});


app.post('/connexion',urlencodedParser,function(req,res){
		res.render('welcome.ejs',{pseudo:req.body.name});
});


app.post('/vote',urlencodedParser,function(req,res){
vote(req.body.can);
res.redirect('/');
});
app.get('/visualisation',(req,res)=>{
var vote = new Array()

//On récupère l'ensemble des vote sur la blockchain
web3.eth.getBlockNumber((err,blockNumber)=>{
	var cptBlock = 0;
	for(cptBlock;cptBlock<=blockNumber;cptBlock++){
		web3.eth.getBlock(cptBlock,(err,block)=>{
			web3.eth.getTransaction(block.transactions[0],(err,trans)=>{
				if(trans.to == urne){
					vote.push(web3.utils.hexToUtf8(trans.input));

				}
			});

		});
	}
});

});





app.listen(3000);






function generateKey(){

	var keys = new Object();
	keys.p = Math.floor(Math.random() * Math.floor(max));
	keys.g =  Math.floor(Math.random() * Math.floor(keys.p))
	keys.x =  Math.floor(Math.random() * Math.floor(max))%keys.p;
	keys.h = Math.pow(keys.g,keys.x);



	return keys
}


function encrypte(keys,nb){
	var message = new Object();
	const k =  Math.floor(Math.random() * 50);
	message.C1 = Math.pow(keys.g,k);
	message.C2 = (Math.pow(keys.h,k)*nb);
	console.log("k",k)
	return message;
}


function decrypte(keys,c1,c2){
	return (c2/(Math.pow(c1,keys.x)))%keys.p
}
