export default async function handler(req, res) {

if(req.method!=="POST"){
return res.status(405).json({result:"Method not allowed"});
}

try{

if(!process.env.GEMINI_API_KEY){
return res.status(500).json({result:"API KEY NOT FOUND"});
}

const {idea}=req.body||{};
if(!idea){
return res.status(400).json({result:"Idea required"});
}

const prompt=`
Create powerful content.

Idea: ${idea}

Return EXACT format:

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
Improve: ...
`;

const r=await fetch("https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent",{
method:"POST",
headers:{
"Content-Type":"application/json",
"x-goog-api-key":process.env.GEMINI_API_KEY
},
body:JSON.stringify({
contents:[{parts:[{text:prompt}]}],
generationConfig:{temperature:0.4,maxOutputTokens:600}
})
});

const d=await r.json();

let raw="";
try{
raw=d.candidates[0].content.parts.map(p=>p.text||"").join("\n");
}catch(e){
raw="";
}

if(!raw){
raw=`Title:
- ${idea} story
- ${idea} struggle
- ${idea} truth

Hook:
- Ek aisi kahani jo dil ko chhoo sakti hai.

Script:
- Shuruaat me strong moment hota hai.
- Beech me struggle aur emotion hota hai.
- End me twist ya impact hota hai.

SEO:
Keywords: ${idea}, viral story, short video
Hashtags: #viral #story
Caption: Strong emotional content

Analysis:
Viral Score: 75%
Strength: Emotional hai
Weakness: Hook aur strong ho sakta hai
Missing: Visual shock
Improve: Strong opening add karo`;
}

raw=raw.replace(/\*\*/g,"").trim();

return res.status(200).json({result:raw});

}catch(e){
return res.status(500).json({result:"Server error"});
}
}
