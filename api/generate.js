export default async function handler(req, res) {
if(req.method!=="POST"){return res.status(405).json({result:"Method not allowed"})}

const {idea}=req.body||{};
if(!idea){return res.status(400).json({result:"Idea required"})}

const prompt=`Give viral content:

Idea: ${idea}

Return:

Title:
- ...
- ...
- ...

Hook:
- ...

Script:
- ...
- ...
- ...

SEO:
Keywords: ...
Hashtags: ...
Caption: ...

Analysis:
Viral Score: ...
Strength: ...
Weakness: ...
Missing: ...
Improve: ...`;

try{
const r=await fetch("https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent",{
method:"POST",
headers:{
"Content-Type":"application/json",
"x-goog-api-key":process.env.GEMINI_API_KEY},
body:JSON.stringify({
contents:[{parts:[{text:prompt}]}]
})
});

const d=await r.json();

let raw="";
try{
raw=d.candidates[0].content.parts.map(p=>p.text||"").join("\n");
}catch(e){raw="Error"}

return res.status(200).json({result:raw});

}catch(e){
return res.status(500).json({result:"Server error"});
}
}
