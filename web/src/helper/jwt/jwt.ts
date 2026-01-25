export function setJwt(token:string){
localStorage.setItem("jwt-token", token);
}

export function getJwt(){
    localStorage.getItem("jwt-token");
}