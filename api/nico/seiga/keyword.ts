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
  const keyword:string = encodeURI(req.query.q);

  const _offset = req.query._offset;
  if (!keyword) {
    errorResponce(res);
    return;
  }

  const _offset_num: number = Number(_offset) / 20;

  const urls = [
    'https://seiga.nicovideo.jp/search/' + keyword + '?page=' + _offset_num,
    'https://seiga.nicovideo.jp/search/' + keyword + '?page=' + calc_sum(_offset_num, 1),
    'https://seiga.nicovideo.jp/search/' + keyword + '?page=' + calc_sum(_offset_num, 2),
    'https://seiga.nicovideo.jp/search/' + keyword + '?page=' + calc_sum(_offset_num, 3),
    'https://seiga.nicovideo.jp/search/' + keyword + '?page=' + calc_sum(_offset_num, 4),
  ]


  try {
    const responce = await Promise.all(urls.map(url => axios.get(url)));
    const data = responce.map(res => res.data);
    const doms = data.map(data => new JSDOM(data));
    let datas: object[] = [];
    doms.forEach(dom => {

      var items = dom.window.document.querySelectorAll('.illust_pict_all .illust_list_img');
      items.forEach(item => {

        // コンテンツID
        var url:string = item.querySelector('.center_img_inner ').getAttribute('href');
        var content_id:string = url.substring(url.indexOf('im'));
        content_id = content_id.substring(0, content_id.indexOf('?'));


        // カウンター
        var coutnertext: string = item.querySelectorAll('.counter_info')[0].textContent;
        var viewCounter:string = coutnertext.substring(coutnertext.indexOf('閲覧：') + 3);
        viewCounter = viewCounter.substring(0, viewCounter.indexOf(' '));
       
        var commentCounter:string = coutnertext.substring(coutnertext.indexOf('コメ：') + 3);
        commentCounter = commentCounter.substring(0, commentCounter.indexOf(' '));

        var mylistCounter:string = coutnertext.substring(coutnertext.indexOf('クリップ：') + 5);
        mylistCounter = commentCounter.substring(0, commentCounter.indexOf(' '));

        var contentsdata: object = {
          contentId: content_id,
          title: item.querySelectorAll('.illust_title a')[0].textContent,
          thumbnailUrl: item.querySelectorAll('.center_img_inner img')[0].getAttribute('src'),
          viewCounter: viewCounter,
          commentCounter: commentCounter,
          mylistCounter: mylistCounter,
        }
        datas.push(contentsdata);
      })

    })

    res.status(200).json(datas);
  } catch (e) {
    errorResponce(res);
  }
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

function calc_sum(a:number, b:number){
  return a + b;
}