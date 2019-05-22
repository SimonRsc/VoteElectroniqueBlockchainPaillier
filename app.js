/*----Initialisation de l'application----*/
const Web3 = require('web3');
const net = require('net');
const http = require('http');
const express= require('express');
const paillier = require('./paillier-bignum/src/paillier.js');
const JSAlert = require("js-alert");
var Tx = require('ethereumjs-tx');
var bodyParser = require('body-parser');
var urlencodedParser = bodyParser.urlencoded({ extended: false });
var app = express();
const web3 = new Web3('http://127.0.0.1:7545');
app.listen(3000);
//css
app.use(express.static(__dirname + '/public'));
/*--------*/
/*----Données utilisateurs----*/
var Electeurs = ["Simon","Tristan","Cecile","Vincent","Jury1","Jury2"];
var account = ["0x617eDC872FD0b3fFCf89A8a45d6F7E88AB54D8CD","0xbd18409F73b58aEFe7Bfca515c7cFEA0BD934dB9","0x3Aa851dFb51E6179f602230a7D79C0b5Cc69B68C","0xE2B6EF8C252443E4EbA11fd59f735E73e3FB842F","0x77309175654cDeF5bbEc900ac6DE14EFf7674a44"



];
var pf = [ "0b67659935b81ce93993b24e2111cc243697dc4dffb043158bed021802d72580",
"17e9ff07a276ffee05f14873ac2c991498d16a7ca1b049a6e288e6735eaddff1",
"f971dbeee55530990f4a2d461107a934157b48f9ac3215379f24ec916c411692",
"d16a96b08e809501d88e5bbb3a76bd69c6c098aa3f36be5196b8f1141db018f0",
"ffe45031462322deeaeb391a8a869a5427807115742c7d3c90e6dc48cd272ca4",
"19715a8d3df1b412ebc22a9fd56478059b22fbe8eb4718034e6ec1f5df2b4609"
];


var account_pub
var account_priv;
var urne = "0xB7A5c180579827D8c4250553057f56177515a350";
/*--------*/

/*----Génération de la clé de l'élection----*/
const {publicKey, privateKey} = paillier.generateRandomKeys(100);

/*--------*/




app.get('/',function(req,res){
	res.render('login.ejs');
});


app.post('/connexion',urlencodedParser,function(req,res){
  var find = 0
  for (var i = 0; i < Electeurs.length; i++) {
    if(Electeurs[i] == req.body.name){
      account_priv = Buffer.from(pf[i],"hex");
      account_pub = account[i];
      	find = 1;
    }
  }
  if(find == 1){
    res.render('welcome.ejs',{pseudo:req.body.name ,success:0});
  }else{
    res.render('login.ejs');
  }
});


app.post('/vote',urlencodedParser,function(req,res){
vote(req.body.can,res,req);
});


app.get('/visualisation', async function(req,res){
var vote = new Array();

//On récupère l'ensemble des vote sur la blockchain
var blockNumber = await getBlockNumber();
var cptBlock = 0;
var block;
	for(cptBlock;cptBlock<=blockNumber;cptBlock++){
		block = await getBlock(cptBlock);
		trans = await getTransactionVote(block);
		if(trans != null && trans.to == urne){
			vote.push(web3.utils.hexToUtf8(trans.input));
		}

	}
if(vote.length>0){
	createVisu(vote,res);
}
});





/*----Création et envoi du vote dans l'urne----*/
function vote(candidat,res,req){
	if(account_pub != null){
		 web3.eth.getBalance(account_pub,function(err,qte){
			 if(qte >=1){
				 const vote = publicKey.encrypt(candidat);
				 web3.eth.getTransactionCount(account_pub,(err,tCount)=>{
					 //On créer la transaction
					 var trans = {
						 nonce : web3.utils.toHex(tCount),
						 to : urne,
						 value : web3.utils.toHex(web3.utils.toWei('1','ether')),
						 gas: web3.utils.toHex('1000000'),
						 gasPrice : web3.utils.toHex(web3.utils.toWei('0','gwei')),
						 //On insère le vote
						 data : web3.utils.utf8ToHex(encodeURI(vote.toString()))
					}

					 //On signe la transaction
					 const tx = new Tx(trans);
					 tx.sign(account_priv);

					 //On la sérialise
					 var serTrans = tx.serialize();
					 serTrans = "0x"+serTrans.toString('hex');

					 //On l'envoi
					 web3.eth.sendSignedTransaction(serTrans,(err,num)=>{
              if(err!= null){
                res.render('welcome.ejs',{pseudo:req.body.name ,success:1, transaction:num});
              }else{
                res.render('welcome.ejs',{pseudo:req.body.name ,success:-2, err:err});
              }
					 });
				 });
			 }else{
          res.render('welcome.ejs',{pseudo:req.body.name ,success:-1});
        }
		});
	}
}
/*--------*/


function createVisu(vote,res){
    let encryptedSum = vote[0];
  for (var i = 1; i < vote.length; i++) {
     encryptedSum = publicKey.addition(encryptedSum, vote[i]);
}
var sum = encryptedSum;
var result = privateKey.decrypt(encryptedSum);
res.render('visualisation.ejs',{sum :sum, res:result,nbVotant:vote.length});
}



 async function getBlockNumber(){

	  blockNumber = await web3.eth.getBlockNumber(async function(err,blockNumber){return blockNumber;});
		return blockNumber;
}

async function getBlock(cptBlock){
	return await web3.eth.getBlock(cptBlock,function(err,block){return block;});
}


async function getTransactionVote(block){
	return await web3.eth.getTransaction(block.transactions[0], function(err,trans){
		 return trans;
	 });
}
