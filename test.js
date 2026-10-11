const http = require('http'); 
http.get('http://localhost:3000/api/media?project_id=1', {
  headers: { 'Cookie': 'directro_token=test' } // We can't easily mock auth, wait.
}, (res) => { 
  let data = ''; res.on('data', chunk => data += chunk); 
  res.on('end', () => console.log(data.substring(0, 500))); 
});
