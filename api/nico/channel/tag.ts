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

  const _sort_query = req.query._sort || 'newest';
  let _sort_order :string = '';
  switch (_sort_query) {
    case 'newest_make':
      _sort_order = 'f&order=d';
      break;
    case 'older_make':
      _sort_order = 'f&order=a';
      break;
    case 'newest_upload':
      _sort_order = 'f&order=d';
      break;
    case 'older_upload':
      _sort_order = 'f&order=a';
      break;
  
    default:
      _sort_order = 'f&order=d';
      break;
  }

  if (!keyword) {
    errorResponce(res);
    return;
  }

  const _offset_num: number = Number(_offset) / 20;

  const urls = [
    `https://ch.nicovideo.jp/search/${keyword}?type=channel&mode=t&page=` + calc_sum(_offset_num, 1) +`&sort=${_sort_order}`,
    `https://ch.nicovideo.jp/search/${keyword}?type=channel&mode=t&page=` + calc_sum(_offset_num, 2) +`&sort=${_sort_order}`,
    `https://ch.nicovideo.jp/search/${keyword}?type=channel&mode=t&page=` + calc_sum(_offset_num, 3) +`&sort=${_sort_order}`,
    `https://ch.nicovideo.jp/search/${keyword}?type=channel&mode=t&page=` + calc_sum(_offset_num, 4) +`&sort=${_sort_order}`,
    `https://ch.nicovideo.jp/search/${keyword}?type=channel&mode=t&page=` + calc_sum(_offset_num, 5) +`&sort=${_sort_order}`,
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
        totalcount = dom.window.document.querySelectorAll('.nav_search .selected a')[0].textContent || '-';
        totalcount = totalcount.replace(/[^0-9]/g, '');
        counter++;
      }


      if(dom.window.document.querySelectorAll('.items .item')){
        var items = dom.window.document.querySelectorAll('.items .item');
        items.forEach(item => {

          // チャンネルID
          var channel_id:string = item.querySelectorAll('a.thumb_ch')[0].getAttribute('href');
          channel_id = channel_id.replace(/[^0-9]/g, '');

          var contentsdata: object = {
            channelId: channel_id,
            title: item.querySelectorAll('a.thumb_ch')[0].getAttribute('title'),
            thumbnailUrl: item.querySelectorAll('a.thumb_ch img')[0].getAttribute('src'),
            description: item.querySelectorAll('.channel_info .channel_detail')[0].textContent,
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