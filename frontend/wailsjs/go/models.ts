export namespace ai {
	
	export class Entity {
	    text: string;
	    label: string;
	    score: number;
	
	    static createFrom(source: any = {}) {
	        return new Entity(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.text = source["text"];
	        this.label = source["label"];
	        this.score = source["score"];
	    }
	}
	export class Relation {
	    head: string;
	    tail: string;
	    label: string;
	    score: number;
	
	    static createFrom(source: any = {}) {
	        return new Relation(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.head = source["head"];
	        this.tail = source["tail"];
	        this.label = source["label"];
	        this.score = source["score"];
	    }
	}

}

export namespace canva {
	
	export class CanvaClient {
	    ClientID: string;
	    ClientSecret: string;
	    AccessToken: string;
	    RefreshToken: string;
	
	    static createFrom(source: any = {}) {
	        return new CanvaClient(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.ClientID = source["ClientID"];
	        this.ClientSecret = source["ClientSecret"];
	        this.AccessToken = source["AccessToken"];
	        this.RefreshToken = source["RefreshToken"];
	    }
	}

}

export namespace config {
	
	export class Config {
	    // Go type: struct { UseLocal bool "json:\"use_local\""; Language string "json:\"language\""; Local struct { Model string "json:\"model\""; Threads int "json:\"threads\"" } "json:\"local\""; Remote struct { URL string "json:\"url\""; Model string "json:\"model\"" } "json:\"remote\"" }
	    whisper: any;
	    llm_url: string;
	    kokoro_url: string;
	    recording_device: string;
	    audio_temp_path: string;
	    only_ttt: boolean;
	    // Go type: struct { ClientID string "json:\"client_id\""; ClientSecret string "json:\"client_secret\""; AccessToken string "json:\"access_token\""; RefreshToken string "json:\"refresh_token\"" }
	    canva: any;
	    // Go type: struct { UseLocal bool "json:\"use_local\""; ModelPath string "json:\"model_path\""; Threshold float32 "json:\"threshold\"" }
	    gliner: any;
	
	    static createFrom(source: any = {}) {
	        return new Config(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.whisper = this.convertValues(source["whisper"], Object);
	        this.llm_url = source["llm_url"];
	        this.kokoro_url = source["kokoro_url"];
	        this.recording_device = source["recording_device"];
	        this.audio_temp_path = source["audio_temp_path"];
	        this.only_ttt = source["only_ttt"];
	        this.canva = this.convertValues(source["canva"], Object);
	        this.gliner = this.convertValues(source["gliner"], Object);
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice && a.map) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}

}

