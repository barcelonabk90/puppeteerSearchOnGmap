//実行方法
//node index.js 検索キー 国フラグ
//例：　node index.js 新橋+焼肉 ja
//例：　node index.js　"england+football club"

//puppeteer を読み込む
const puppeteer = require('puppeteer');

//国のフラグ
const searchLocation = process.argv[3];

//検索キー
const searchKey = process.argv[2];

let url;

//日本語で検索する場合
if(searchLocation == 'ja'){
	//ルートURL
	url = "https://www.google.co.jp/maps/search/";
}else {
	//日本語でない場合
	url = "https://www.google.com/maps/search/";
}

//各店舗の情報を含むDOM div要素
const mainClass = "div.section-result-text-content";
//店舗タイトルを含むDOM要素
const titleEle = "h3 span";
//店舗の評価スコアを含むDOM要素
const scoreEle = "span.cards-rating-score";
//店舗の評価数を含むDOM要素
const rateEle = "span.section-result-num-ratings";
//店舗の住所を含むDOM要素
const addressEle = "span.section-result-location";

//メインプログラムを宣言する
const search = async () => {
	//ブラウザを起動する
	//const browser = await puppeteer.launch({headless: false});
	const browser = await puppeteer.launch();
	//ブラウザのタブを開く
	const page = await browser.newPage();
	//サイトへアクセス
	await page.goto(url + searchKey);
	//店舗一覧の配列
	let shops = await getShopList(page);
	shops.sort(compareObj);
	const cnt = shops.length;
	console.log(url + searchKey);
	for(let i = 0 ; i < cnt; i++){
		console.log(`Rank ` + (i+1));
		console.log(shops[i]);
	}
	//処理を終了する
	await browser.close();
};

//すべて店舗を取得する
const getShopList = async page => {
	let shops = [];
	try{
		await page.waitFor(mainClass, {timeout: 5000});
		const divs = await page.$$(mainClass);
		const len = divs.length;
		for(let i = 0 ; i < len; i++){
			const shop = await getShopInfo(divs[i]);
			if(shop){
				shops.push(shop);
			}
		}
	}catch(err){
		console.log("エラーが発生しました。" + err);
		process.exit(1);
	}
	return shops;
};

//オブジェクトのソート
const compareObj = (a, b) => {
	//評価数　< 10	の場合、ランクを下げる
	if(a.rate >= 10 && b.rate < 10){
		return -1;
	}
	if(a.rate < 10 && b.rate >= 10){
		return 1;
	}
	
	//両方とも評価数　< 10 または評価数　>= 10
	if(a.score > b.score){
		return -1;
	}else if(a.score < b.score){
		return 1;
	}else {
		if(a.rate >= b.rate){
			return -1;
		}else{
			return 1;
		}
	}
}

//要素のテキストを取得する
const getText = ele => ele.innerText;

//店舗の情報を取得する
const getShopInfo = async (div) => {
	let name, score, rate, addr;
	try{
	//店舗の名
	name = await div.$eval(titleEle, getText);
	//店舗の評価スコア
	score = await div.$eval(scoreEle, getText);
	//店舗の評価数
	rate = await div.$eval(rateEle, getText);
	//店舗のアドレス
	addr = await div.$eval(addressEle, getText);
	
	} catch(err){
		console.log(name + score + rate + addr + err);
		return false;
	}
	return {
		name : name,
		score : score,
		rate : rate.match(/\d+/)[0],
		addr : addr
	};
};
//メインプログラムを実行する
search();
