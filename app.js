/*----Initialisation de l'application----*/
const Web3 = require('web3');
const net = require('net');
const http = require('http');
const express= require('express');
var Tx = require('ethereumjs-tx');
var bodyParser = require('body-parser');
var urlencodedParser = bodyParser.urlencoded({ extended: false });
var app = express();
const web3 = new Web3('http://127.0.0.1:7545');
app.listen(3000);
/*--------*/

/*----Données utilisateurs----*/
//A automatiser
var account_pub = "0x67bD3C0315D3FD683d5b23Dc6674bB2BF9b3E675";
var account_priv = Buffer.from("18efc807ea189568cd170beefd70da6a7d5c06ce858f22aef704291f67c642f1",'hex');
var urne = "0xF8301b7fCC4De7a973f89215f7902b894Efb0C13";
/*--------*/

/*----Génération de la clé de l'élection----*/
const max = 600; //Nombre maximum pour la génération des clés
var keys = generateKey();
/*--------*/


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
		if(trans != null && trans.to == urne){
					vote.push(web3.utils.hexToUtf8(trans.input));
					console.log(web3.utils.hexToUtf8(trans.input));
					/*var tab = web3.utils.hexToUtf8(trans.input);
					tab = tab.split(':')
					if(tab.size>1){
					console.log(decrypte(keys,tab[0],tab[]));
				}*/
				}
			});
		});
	}
});
});



/*----Création et envoi du vote dans l'urne----*/
function vote(candidat){
	if(account_pub != null){
		 web3.eth.getBalance(account_pub,function(err,qte){
			 if(qte >=1){
				 const vote = encrypte(keys,candidat);
				 web3.eth.getTransactionCount(account_pub,(err,tCount)=>{
					 //On créer la transaction
					 var trans = {
						 nonce : web3.utils.toHex(tCount),
						 to : urne,
						 value : web3.utils.toHex(web3.utils.toWei('1','ether')),
						 gas: web3.utils.toHex('1000000'),
						 gasPrice : web3.utils.toHex(web3.utils.toWei('10','gwei')),
						 //On insère le vote
						 data : web3.utils.utf8toHex(encodeURI(vote.C1.toString()+":"+vote.C2.toString()))
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
/*--------*/


/*----Génération de la clé du vote----*/
function generateKey(){
	var keys = new Object();
	keys.p = Math.floor(Math.random() * Math.floor(max));
	keys.g =  Math.floor(Math.random() * Math.floor(keys.p));
	keys.x =  Math.floor(Math.random() * Math.floor(max))%keys.p;
	keys.h = puissance(keys.g,keys.x,keys.p);
	return keys;
}
/*--------*/

/*----Fonction d'encryptage d'un vote----*/
function encrypte(keys,nb){
	var message = new Object();
	const k =  Math.floor(Math.random() * 50);
	message.C1 = puissance(keys.g,k,keys.p);
	message.C2 = (puissance(keys.h,k,keys.p)*nb);
	return message;
}
/*--------*/

/*----Fonction de décryptage d'un vote----*/
function decrypte(keys,c1,c2){
	return (c2/(puissance(c1,keys.x,keys.p)));
}
/*--------*/

/*----Fonction de puissance avec un modulo----*/
function puissance(nb,puis,mod){
	res = nb;
	cpt = 1;
	while (cpt <= puis){
		res = (res * nb)%mod;
		cpt++;
	}
	return res;
}
/*--------*/
