import { NowRequest, NowResponse } from "@vercel/node";
import axios from "axios";
import { JSDOM } from "jsdom";

/**
 * OGPタグを取得して、そのcontentをJSON形式で返す.
 * 使用例:
 *    endpoint/api/ogp?url="サイトのURL"
 *
 * @param req HTTP request
 * @param res HTTP responce
 */
export default async function (req: NowRequest, res: NowResponse) {
  let keyword = req.query.q + '';
  keyword = encodeURI(keyword)
  if (!keyword) {
    errorResponce(res);
    return;
  }

  const url_seiga = 'https://seiga.nicovideo.jp/search/' + keyword;
  const url_ch = 'https://ch.nicovideo.jp/search/' + keyword;
  const url_blomaga = 'https://ch.nicovideo.jp/search/' + keyword + '?type=article';
  const url_atsumaru = 'https://game.nicovideo.jp/atsumaru/search/word/' + keyword;
  const url_commons = 'https://public-api.commons.nicovideo.jp/v1/materials/search/keywords?q='+ keyword +'&_limit=5&_offset=0&_sort=-startTime';
  const url_news = 'https://news.nicovideo.jp/search?q=' + keyword;
  const url_3d = 'https://3d.nicovideo.jp/search?word_type=caption&word=' + keyword;
  const url_community = 'https://com.nicovideo.jp/search/' + keyword;
  
  // ログイン必須
  // const url_q = 'https://api.q.nicovideo.jp/api/v1/question_books/search?q='+ keyword +'&page=1&per=10&sort=created_at&order=desc&mode=all&type=all';

  // try {
    const [responce_seiga, responce_ch, responce_blomaga, responce_atsumaru, responce_commons, responce_news, responce_3d, responce_community] = await Promise.all([
      axios.get(url_seiga),
      axios.get(url_ch),
      axios.get(url_blomaga),
      axios.get(url_atsumaru),
      axios.get(url_commons),
      axios.get(url_news),
      axios.get(url_3d),
      // axios.get(url_q),
      axios.get(url_community),
    ]);

    // 静画整理
    const data_seiga = responce_seiga.data;
    const dom_seiga = new JSDOM(data_seiga);
    let meta_seiga = dom_seiga.window.document.querySelectorAll(".tab_table strong");
    
    meta_seiga.forEach(element => {
      if(element.textContent){
        element.textContent = element.textContent.replace(',', '');
      }else{
        element.textContent = '0';
      }
    });

    // チャンネル整理
    const data_ch = responce_ch.data;
    const dom_ch = new JSDOM(data_ch);
    const meta_ch = dom_ch.window.document.querySelectorAll(".articles_total_number");

    // ブロマガ整理
    const data_blomaga = responce_blomaga.data;
    const dom_blomaga = new JSDOM(data_blomaga);
    const meta_blomaga = dom_blomaga.window.document.querySelectorAll(".articles_total_number");

    // アツマール
    const data_atsumaru = responce_atsumaru.data;
    const dom_atsumaru = new JSDOM(data_atsumaru);
    const meta_atsumaru = dom_atsumaru.window.document.querySelectorAll(".SectionHeader__Notes");
    let textcontent_atsumaru: string = '';
    if(meta_atsumaru[0] && meta_atsumaru[0].textContent){
      textcontent_atsumaru = meta_atsumaru[0].textContent;
      textcontent_atsumaru = textcontent_atsumaru.substr(0, textcontent_atsumaru.indexOf("件")).slice(3);
    }else{
      textcontent_atsumaru = '-';
    }

    // ニュース
    const data_news = responce_news.data;
    const dom_news = new JSDOM(data_news);
    const meta_news = dom_news.window.document.querySelectorAll(".panel-group .is-xlarge.is-pulled-left");
    let textcontent_news: string = '';
    if(meta_news[0] && meta_news[0].textContent){
      textcontent_news = meta_news[0].textContent;
      textcontent_news = textcontent_news.replace('件以上', '+');
      textcontent_news = textcontent_news.replace('件', '');
      textcontent_news = textcontent_news.replace('検索結果：', '');
    }else{
      textcontent_news = '-';
    }

    // 立体
    const data_3d = responce_3d.data;
    const dom_3d = new JSDOM(data_3d);
    const meta_3d = dom_3d.window.document.querySelectorAll("#search-container .count");
    let textcontent_3d: string = '';
    if(meta_3d[0] && meta_3d[0].textContent){
      textcontent_3d = meta_3d[0].textContent;
      textcontent_3d = textcontent_3d.substr(0, textcontent_3d.indexOf("件"));
      textcontent_3d.replace(',', '');
    }else{
      textcontent_3d = '-';
    }

    // コミュ
    const data_community = responce_community.data;
    const dom_community = new JSDOM(data_community);
    const meta_community = dom_community.window.document.querySelectorAll(".pageCount.pageCountBottom strong");
    let textcontent_community: string = '';
    if(meta_community[0] && meta_community[0].textContent){
      textcontent_community = meta_community[0].textContent;
      textcontent_community = textcontent_community.replace(',', '');
    }else{
      textcontent_community = '-';
    }



    const resdata = {
      'video': meta_seiga[0].textContent,
      'mylist': meta_seiga[1].textContent,
      'illust': meta_seiga[2].textContent,
      'live': meta_seiga[3].textContent,
      'channel': meta_ch[0] && meta_ch[0].textContent ? meta_ch[0].textContent : '0',
      'blomaga': meta_blomaga[0] && meta_blomaga[0].textContent ? meta_blomaga[0].textContent : '0',
      'atsumaru': textcontent_atsumaru,
      'commons': responce_commons.data.data.total,
      'news': textcontent_news,
      '3d': textcontent_3d,
      // 'q': responce_q.data.data.total,
      'community': textcontent_community,
    }

    res.status(200).json(resdata);
  // } catch (e) {
  //   errorResponce(res);
  // }
}

function isValidUrlParameter(url: string | string[]): boolean {
  return !(url == undefined || url == null || Array.isArray(url));
}

function getUrlParameter(req: NowRequest): string | null {
  const { url } = req.query;
  if (isValidUrlParameter(url)) {
    return <string>url;
  }
  return null;
}

function errorResponce(res: NowResponse): void {
  res.status(400).send("error");
}
