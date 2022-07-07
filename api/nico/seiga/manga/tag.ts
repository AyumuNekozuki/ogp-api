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
  const keyword = encodeURI(req.query.q + '');
  const _offset = req.query._offset;
  // const target = req.query.target || 'illust_all';

  const _sort_query = req.query._sort;
  let _sort_order :string = '';
  switch (_sort_query) {
    case '-viewCounter':
      _sort_order = 'manga_view';
      break;
    case '+viewCounter':
      _sort_order = 'manga_view_a';
      break;
    case '-commentCounter':
      _sort_order = 'comment_count';
      break;
    case '+commentCounter':
      _sort_order = 'comment_count_a';
      break;
    case '-mylistCounter':
      _sort_order = 'manga_favorite';
      break;
    case '+mylistCounter':
      _sort_order = 'manga_favorite_a';
      break;
  
    default:
      break;
  }

  if (!keyword) {
    errorResponce(res);
    return;
  }

  const _offset_num: number = Number(_offset) / 20;

  const urls = [
    `https://seiga.nicovideo.jp/manga/tag/${keyword}?page=` + calc_sum(_offset_num, 1) +`&sort=${_sort_order}`,
    `https://seiga.nicovideo.jp/manga/tag/${keyword}?page=` + calc_sum(_offset_num, 2) +`&sort=${_sort_order}`,
    `https://seiga.nicovideo.jp/manga/tag/${keyword}?page=` + calc_sum(_offset_num, 3) +`&sort=${_sort_order}`,
    `https://seiga.nicovideo.jp/manga/tag/${keyword}?page=` + calc_sum(_offset_num, 4) +`&sort=${_sort_order}`,
    `https://seiga.nicovideo.jp/manga/tag/${keyword}?page=` + calc_sum(_offset_num, 5) +`&sort=${_sort_order}`,
  ]


  try {
    const responce = await Promise.all(urls.map(url => axios.get(url)));
    const data = responce.map(res => res.data);
    const doms = data.map(data => new JSDOM(data));
    let datas: object[] = [];
    let totalcount: string = '';

    let counter:number = 0;
    doms.forEach(dom => {

      if(counter == 0){
        totalcount = dom.window.document.querySelectorAll('#main_title .number')[0].textContent || '-';
        totalcount = totalcount.replace(/[^0-9]/g, '');
        counter++;
      }

      if(dom.window.document.querySelectorAll('#comic_list .mg_item')){
        var items = dom.window.document.querySelectorAll('#comic_list .mg_item');
        items.forEach(item => {

          // コンテンツID
          var url:string = item.querySelector('.mg_body .title a').getAttribute('href');
          var content_id:string = url.substring(url.indexOf('comic/'));
          content_id = content_id.substring(0, content_id.indexOf('?'));

          // アップロード
          var upload_date:string = item.querySelectorAll('.mg_date.dates .date.updated')[0].textContent;
          upload_date = upload_date.replace(/[^0-9]/g, '');

          var contentsdata: object = {
            contentId: content_id,
            title: item.querySelectorAll('.mg_body .title a')[0].textContent,
            thumbnailUrl: item.querySelectorAll('.comic_icon .center_img_inner img')[0].getAttribute('src'),
            viewCounter: undefined,
            commentCounter: undefined,
            mylistCounter: undefined,
            startTime: upload_date,
            userName: item.querySelectorAll('.mg_description_header .mg_author')[0].textContent,
          }
          datas.push(contentsdata);
        })
      }
    })

    const responsedata: object = {
      meta: {
        status: 200,
        totalcount: totalcount,
      },
      data: datas, 
    }

    res.status(200).json(responsedata);
  } catch (e) {
    console.log(e)
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