const fs = require('fs');
const request = require('request');

const seed_url = "https://raw.githubusercontent.com/EFForg/privacybadger/master/src/data/seed.json";
const aa_url = "https://easylist-downloads.adblockplus.org/exceptionrules.txt";


const fetch_seed_data = seed_url => {
  return new Promise((resolve, reject) => {
    request.get(seed_url, {json: true}, (err, res, body) => {
      if (err) { return reject(err) }
      resolve(body);
    });
  });
};

const fetch_aa_data = aa_url => {
  return new Promise((resolve, reject) => {
    request.get(aa_url, {}, (err, res, body) => {
      if (err) { return reject(err) }
      resolve(body);
    });
  });
};


const base_name = path => {
  const path_split = path.split("/");
  return path_split[path_split.length - 1];
};

const read_seed_data = seed_url => {
  return new Promise(resolve => {
    resolve(JSON.parse(fs.readFileSync(base_name(seed_url))));
  });
};

const read_aa_data = seed_url => {
  return new Promise(resolve => {
    resolve(String(fs.readFileSync(base_name(aa_url))));
  });
};


const main = async () => {
  const [seed, aa] = await Promise.all([
    fetch_seed_data(seed_url),
    fetch_aa_data(aa_url)
  ]);

  let candidates = new Set();
  for(const domain in seed.action_map){
    if(seed.action_map[domain].heuristicAction == "block" && domain in seed.snitch_map && seed.snitch_map[domain].length >= 3){
      candidates.add(domain);
    }
  }

  const candidates_regex = Array.from(candidates).join("|").replace(/\./g, '\\.');
  let regex = RegExp(`(${candidates_regex})`, 'g');
  const matches = aa.match(regex);

  let matches_set = new Set();
  for(const match of matches){
    matches_set.add(match);
  }

  console.log("Found a set of domains on the Privacy Badger pre-block list which are mentioned somewhere in the Acceptable Ads list as well:\n");
  console.log(JSON.stringify(Array.from(matches_set).sort()));
};

main();
