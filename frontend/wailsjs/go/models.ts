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
	
	export class RecentCompendium {
	    path: string;
	    name: string;
	    // Go type: time
	    last_opened_at: any;
	
	    static createFrom(source: any = {}) {
	        return new RecentCompendium(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.path = source["path"];
	        this.name = source["name"];
	        this.last_opened_at = this.convertValues(source["last_opened_at"], null);
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
	export class Config {
	    last_compendium_path?: string;
	    last_opened_file?: string;
	    recent_compendiums?: RecentCompendium[];
	    auto_save_debounce_ms?: number;
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
	        this.last_compendium_path = source["last_compendium_path"];
	        this.last_opened_file = source["last_opened_file"];
	        this.recent_compendiums = this.convertValues(source["recent_compendiums"], RecentCompendium);
	        this.auto_save_debounce_ms = source["auto_save_debounce_ms"];
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

export namespace diagram {
	
	export class Edge {
	    source: string;
	    target: string;
	    label: string;
	
	    static createFrom(source: any = {}) {
	        return new Edge(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.source = source["source"];
	        this.target = source["target"];
	        this.label = source["label"];
	    }
	}
	export class Node {
	    id: string;
	    label: string;
	    type: string;
	    x: number;
	    y: number;
	
	    static createFrom(source: any = {}) {
	        return new Node(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.id = source["id"];
	        this.label = source["label"];
	        this.type = source["type"];
	        this.x = source["x"];
	        this.y = source["y"];
	    }
	}

}

export namespace git {
	
	export class CommitInfo {
	    hash: string;
	    short_hash: string;
	    message: string;
	    author_name: string;
	    author_email: string;
	    // Go type: time
	    timestamp: any;
	    date_str: string;
	
	    static createFrom(source: any = {}) {
	        return new CommitInfo(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.hash = source["hash"];
	        this.short_hash = source["short_hash"];
	        this.message = source["message"];
	        this.author_name = source["author_name"];
	        this.author_email = source["author_email"];
	        this.timestamp = this.convertValues(source["timestamp"], null);
	        this.date_str = source["date_str"];
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
	export class FileStatus {
	    path: string;
	    status: string;
	    staged: boolean;
	
	    static createFrom(source: any = {}) {
	        return new FileStatus(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.path = source["path"];
	        this.status = source["status"];
	        this.staged = source["staged"];
	    }
	}

}

export namespace models {
	
	export class ModelInfo {
	    id: string;
	    name: string;
	    description: string;
	    category: string;
	    sizeMb: number;
	    isInstalled: boolean;
	    diskPath: string;
	    isBundle: boolean;
	    files: string[];
	
	    static createFrom(source: any = {}) {
	        return new ModelInfo(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.id = source["id"];
	        this.name = source["name"];
	        this.description = source["description"];
	        this.category = source["category"];
	        this.sizeMb = source["sizeMb"];
	        this.isInstalled = source["isInstalled"];
	        this.diskPath = source["diskPath"];
	        this.isBundle = source["isBundle"];
	        this.files = source["files"];
	    }
	}

}

export namespace storage {
	
	export class ProjectMeta {
	    id: string;
	    name: string;
	    description: string;
	    author: string;
	    email: string;
	    version: string;
	    // Go type: time
	    created_at: any;
	    // Go type: time
	    updated_at: any;
	    settings?: Record<string, string>;
	
	    static createFrom(source: any = {}) {
	        return new ProjectMeta(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.id = source["id"];
	        this.name = source["name"];
	        this.description = source["description"];
	        this.author = source["author"];
	        this.email = source["email"];
	        this.version = source["version"];
	        this.created_at = this.convertValues(source["created_at"], null);
	        this.updated_at = this.convertValues(source["updated_at"], null);
	        this.settings = source["settings"];
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
	export class CompendiumInfo {
	    path: string;
	    meta: ProjectMeta;
	    last_commit: string;
	    is_clean: boolean;
	
	    static createFrom(source: any = {}) {
	        return new CompendiumInfo(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.path = source["path"];
	        this.meta = this.convertValues(source["meta"], ProjectMeta);
	        this.last_commit = source["last_commit"];
	        this.is_clean = source["is_clean"];
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
	export class FileNode {
	    name: string;
	    relative_path: string;
	    is_dir: boolean;
	    size: number;
	    // Go type: time
	    mod_time: any;
	    category: string;
	    children?: FileNode[];
	
	    static createFrom(source: any = {}) {
	        return new FileNode(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.name = source["name"];
	        this.relative_path = source["relative_path"];
	        this.is_dir = source["is_dir"];
	        this.size = source["size"];
	        this.mod_time = this.convertValues(source["mod_time"], null);
	        this.category = source["category"];
	        this.children = this.convertValues(source["children"], FileNode);
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
	export class JournalEntryInfo {
	    slug: string;
	    title: string;
	    path: string;
	    date: string;
	    related_session?: string;
	    summary?: string;
	    // Go type: time
	    mod_time: any;
	
	    static createFrom(source: any = {}) {
	        return new JournalEntryInfo(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.slug = source["slug"];
	        this.title = source["title"];
	        this.path = source["path"];
	        this.date = source["date"];
	        this.related_session = source["related_session"];
	        this.summary = source["summary"];
	        this.mod_time = this.convertValues(source["mod_time"], null);
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
	export class ModuleInfo {
	    slug: string;
	    title: string;
	    path: string;
	    description: string;
	
	    static createFrom(source: any = {}) {
	        return new ModuleInfo(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.slug = source["slug"];
	        this.title = source["title"];
	        this.path = source["path"];
	        this.description = source["description"];
	    }
	}
	
	export class WizardCalendar {
	    start_date: string;
	    session_duration: number;
	    vacations?: string[];
	    milestones?: string[];
	
	    static createFrom(source: any = {}) {
	        return new WizardCalendar(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.start_date = source["start_date"];
	        this.session_duration = source["session_duration"];
	        this.vacations = source["vacations"];
	        this.milestones = source["milestones"];
	    }
	}
	export class WizardSession {
	    title: string;
	    week: number;
	    date?: string;
	    objectives?: string[];
	
	    static createFrom(source: any = {}) {
	        return new WizardSession(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.title = source["title"];
	        this.week = source["week"];
	        this.date = source["date"];
	        this.objectives = source["objectives"];
	    }
	}
	export class WizardModule {
	    slug: string;
	    title: string;
	    description: string;
	    year?: number;
	    session_count: number;
	    sessions?: WizardSession[];
	
	    static createFrom(source: any = {}) {
	        return new WizardModule(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.slug = source["slug"];
	        this.title = source["title"];
	        this.description = source["description"];
	        this.year = source["year"];
	        this.session_count = source["session_count"];
	        this.sessions = this.convertValues(source["sessions"], WizardSession);
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
	export class WizardTemplateBlock {
	    id: string;
	    title: string;
	    kind: string;
	    content: string;
	    enabled: boolean;
	
	    static createFrom(source: any = {}) {
	        return new WizardTemplateBlock(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.id = source["id"];
	        this.title = source["title"];
	        this.kind = source["kind"];
	        this.content = source["content"];
	        this.enabled = source["enabled"];
	    }
	}
	export class WizardConfig {
	    target_dir: string;
	    name: string;
	    description: string;
	    author: string;
	    email: string;
	    horizon_type: string;
	    years: number;
	    duration_minutes: number;
	    include_instructor_notes: boolean;
	    include_student_notes: boolean;
	    template_blocks?: WizardTemplateBlock[];
	    modules: WizardModule[];
	    calendar: WizardCalendar;
	
	    static createFrom(source: any = {}) {
	        return new WizardConfig(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.target_dir = source["target_dir"];
	        this.name = source["name"];
	        this.description = source["description"];
	        this.author = source["author"];
	        this.email = source["email"];
	        this.horizon_type = source["horizon_type"];
	        this.years = source["years"];
	        this.duration_minutes = source["duration_minutes"];
	        this.include_instructor_notes = source["include_instructor_notes"];
	        this.include_student_notes = source["include_student_notes"];
	        this.template_blocks = this.convertValues(source["template_blocks"], WizardTemplateBlock);
	        this.modules = this.convertValues(source["modules"], WizardModule);
	        this.calendar = this.convertValues(source["calendar"], WizardCalendar);
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

export namespace updater {
	
	export class UpdateInfo {
	    available: boolean;
	    currentVersion: string;
	    latestVersion: string;
	    releaseNotes: string;
	    downloadUrl: string;
	    assetName: string;
	    assetSize: number;
	    publishedAt: string;
	
	    static createFrom(source: any = {}) {
	        return new UpdateInfo(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.available = source["available"];
	        this.currentVersion = source["currentVersion"];
	        this.latestVersion = source["latestVersion"];
	        this.releaseNotes = source["releaseNotes"];
	        this.downloadUrl = source["downloadUrl"];
	        this.assetName = source["assetName"];
	        this.assetSize = source["assetSize"];
	        this.publishedAt = source["publishedAt"];
	    }
	}

}

