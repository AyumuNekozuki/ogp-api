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
  const target = req.query.target || 'illust_all';

  const _sort_query = req.query._sort;
  let _sort_order :string = '';
  switch (_sort_query) {
    case '-viewCounter':
      _sort_order = 'image_view';
      break;
    case '+viewCounter':
      _sort_order = 'image_view_a';
      break;
    case '-commentCounter':
      _sort_order = 'comment_count';
      break;
    case '+commentCounter':
      _sort_order = 'comment_count_a';
      break;
    case '-mylistCounter':
      _sort_order = 'clip_count';
      break;
    case '+mylistCounter':
      _sort_order = 'clip_count_a';
      break;
  
    default:
      _sort_order = 'image_view';
      break;
  }

  if (!keyword) {
    errorResponce(res);
    return;
  }

  const _offset_num: number = Number(_offset) / 20;

  const urls = [
    `https://seiga.nicovideo.jp/tag/${keyword}?page=` + calc_sum(_offset_num, 1) +`&sort=${_sort_order}&target=${target}`,
    `https://seiga.nicovideo.jp/tag/${keyword}?page=` + calc_sum(_offset_num, 2) +`&sort=${_sort_order}&target=${target}`,
    `https://seiga.nicovideo.jp/tag/${keyword}?page=` + calc_sum(_offset_num, 3) +`&sort=${_sort_order}&target=${target}`,
    `https://seiga.nicovideo.jp/tag/${keyword}?page=` + calc_sum(_offset_num, 4) +`&sort=${_sort_order}&target=${target}`,
    `https://seiga.nicovideo.jp/tag/${keyword}?page=` + calc_sum(_offset_num, 5) +`&sort=${_sort_order}&target=${target}`,
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
        totalcount = dom.window.document.querySelectorAll('.refine_list li a span.count')[2].textContent || '-';
        totalcount = totalcount.replace(/[^0-9]/g, '');
        counter++;
      }


      if(dom.window.document.querySelectorAll('.item_list .list_item')){
        var items = dom.window.document.querySelectorAll('.item_list .list_item');
        items.forEach(item => {

          // コンテンツID
          var url:string = item.querySelector('a').getAttribute('href');
          var content_id:string = url.substring(url.indexOf('im'));

          var contentsdata: object = {
            contentId: content_id,
            title: item.querySelectorAll('.illust_info .title')[0].textContent,
            userName: item.querySelectorAll('.illust_info .user')[0].textContent,
            thumbnailUrl: item.querySelectorAll('.thum img')[0].getAttribute('src'),
            viewCounter: item.querySelectorAll('.illust_count .view')[0].textContent,
            commentCounter: item.querySelectorAll('.illust_count .comment')[0].textContent,
            mylistCounter: item.querySelectorAll('.illust_count .clip')[0].textContent,
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