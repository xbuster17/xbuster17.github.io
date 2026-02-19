var This;
var MAX_RAD_FUNC = 9;
function tree_set_rad_influence(e){
	let val = parseFloat(e.value);
	This.Di = val;
}

function tree_set_kill_distance(e){
	let val = Math.max( 0.05, parseFloat(e.value));
	This.Dk = val;
}

function tree_show_mesh(e){ This.show_mesh = e.checked; DrawScene(); }

function tree_show_leaves(e){ This.show_leaves = e.checked; DrawScene(); }

function tree_show_spaces(e){ This.show_spaces = e.checked; DrawScene(); }

function update_space_event(e){
	let c = e.srcElement.class;
	let i = e.srcElement.id-1;
	let val = parseInt(e.srcElement.value);
	let s = This.spaces[i];
	
	let x = s.x;
	let y = s.y;
	let z = s.z;
	let r = s.r;
	let f = s.f;
	let res = s.res;
	switch( c ){
		case "x": x = val/100; break;
		case "y": y = val/100; break;
		case "z": z = val/100; break;
		case "f": f = val; break;
		case "r": r = val/100; break;
		case "res": res = [val,val]; break;
		case "a": s.amt = val; break;
		case "e": s.exp = val; break;
		default: break;
	}
	This.set_space(i, x, y, z, r, f, res);
	DrawScene();
}
function spaces_add_click(){
	const div = document.createElement('div');
	This.spaces_div_ref.push(div);
	let id = This.spaces_div_ref.length;

	let c = document.createElement('input');
	c.type = "number";
	c.size = "2";
	c.min = 0;
	c.max = MAX_RAD_FUNC;
	c.value = 0;
	c.id = id;
	c.class = 'f';
	
	c.onchange = update_space_event;
	div.appendChild(c);
	let xs = document.createElement('input');
	xs.type = "range";
	xs.id = id;
	xs.class = 'x';
	xs.min=-100;
	xs.max=100;
	xs.value = 0;
	xs.step=1;
	xs.oninput = update_space_event;
	div.appendChild(xs);

	xs = document.createElement('input');
	xs.type = "range";
	xs.id = id;
	xs.class = 'y';
	xs.min=-100;
	xs.max=100;
	xs.value = 0;
	xs.step=1;
	xs.oninput = update_space_event;
	div.appendChild(xs);

	xs = document.createElement('input');
	xs.type = "range";
	xs.id = id;
	xs.class = 'z';
	xs.min=-100;
	xs.max=100;
	xs.value = 0;
	xs.step=1;
	xs.oninput = update_space_event;
	div.appendChild(xs);

	xs = document.createElement('input');
	xs.type = "range";
	xs.id = id;
	xs.class = 'r';
	xs.min=1;
	xs.max=100;
	xs.value = 50;
	xs.step=1;
	xs.oninput = update_space_event;
	div.appendChild(xs);

	xs = document.createElement('input');
	xs.type = "range";
	xs.id = id;
	xs.class = 'a';
	xs.min=1;
	xs.max=10000;
	xs.value = 1000;
	xs.step=1;
	xs.oninput = update_space_event;
	div.appendChild(xs);

	xs = document.createElement('input');
	xs.type = "range";
	xs.id = id;
	xs.class = 'e';
	xs.min=1;
	xs.max=100;
	xs.value = 1;
	xs.step=1;
	xs.oninput = update_space_event;
	div.appendChild(xs);

	This.spaces_div.appendChild(div);
	This.add_space(0,0,0, .5, 0, [100,100]);
	DrawScene();
}

function spaces_rm_click(){
	if(This.spaces.length == 1) return;
	This.rm_space();
	let div = This.spaces_div_ref.pop();
	div.remove();
	DrawScene();

}

class MeshDrawer
{
	constructor()
	{
		This = this;
		this.show_leaves = 1;
		this.show_mesh = 1;
		this.show_spaces = 1;
		document.getElementById( "show_mesh" ).checked = 1;
		document.getElementById( "show_leaves" ).checked = 1;
		document.getElementById( "show_spaces" ).checked = 1;
		this.Dk = 0.2;
		this.Di = 3;
		document.getElementById("Dk").value = this.Dk;
		document.getElementById("Di").value = this.Di;

		this.init_rad = .09;
		this.spaces_div = document.getElementById("spaces_div");
		this.spaces_div_ref = []; // array for added divs

		this.prog = InitShaderProgram( meshVS, meshFS );
		gl.useProgram(this.prog);
		
		this.mvp_u = gl.getUniformLocation(this.prog,'mvp');
		this.mv_u = gl.getUniformLocation(this.prog,'mv');
		
		this.mn_u = gl.getUniformLocation(this.prog,'mn');
		this.ldir_u = gl.getUniformLocation(this.prog,'ldir');
		this.lcol_u = gl.getUniformLocation(this.prog,'lcol');
		this.lint_u = gl.getUniformLocation(this.prog,'lint');

		this.show_tex_u = gl.getUniformLocation(this.prog,'show_tex');
		this.show_tex = 1;
		this.swapyz_u = gl.getUniformLocation(this.prog,'swapyz');
		this.swapyz = 0;
		this.tex_u = gl.getUniformLocation(this.prog,'tex');
		this.tex_unit = 0;
		
		this.pos = gl.getAttribLocation(this.prog, 'pos');
		this.uv = gl.getAttribLocation(this.prog, 'uv');
		this.nor = gl.getAttribLocation(this.prog, 'nor');
		
		this.buf = gl.createBuffer();
		this.ibo = gl.createBuffer();
		
		this.texture = gl.createTexture();
		this.sphere_tex = gl.createTexture();
		this.ground_tex = gl.createTexture();

		this.ldir = {}
		this.ldir.x = 0;
		this.ldir.y = 0;
		this.ldir.z = 0;
		this.lcol = {}
		this.lcol.x = 1;
		this.lcol.y = 1;
		this.lcol.z = 1;

		this.setShininess(16);

		this.spaces = [];
		this.draw_spaces = 1;

		this.gentex();

		// puntos 
		this.leaves_vbo = gl.createBuffer();
		this.leaves = [];

		//ground
		this.ground_buf = gl.createBuffer();

		let v = [
			-1, -1 ,-1, 0,0, 0,1,0,  
			 1, -1 ,-1, 1,0, 0,1,0,  
			-1, -1 , 1, 0,1, 0,1,0,  
			 1, -1 , 1, 1,1, 0,1,0
		];
		gl.bindBuffer( gl.ARRAY_BUFFER, this.ground_buf);
		gl.bufferData( gl.ARRAY_BUFFER,	new Float32Array(v), gl.STATIC_DRAW );

	}

	// space (envelope) functions
	build_space(i){
		if(i===undefined) return;
		let s = this.spaces[i];
		if(s.buf === undefined) s.buf = gl.createBuffer();
		if(s.res===undefined) s.res = [50,50];
		if(s.x===undefined) s.x = 0;
		if(s.y===undefined) s.y = 0;
		if(s.z===undefined) s.z = 0;
		if(s.r===undefined) s.r = .5;
		if(s.f===undefined) s.f = 0;
		
		let v = create_sphere(s.res[0],s.res[1], s.f);
		s.buf_len = v.length; //
		s.num_points = v.length / ( 3+2+3);
		gl.bindBuffer( gl.ARRAY_BUFFER, s.buf);
		gl.bufferData( gl.ARRAY_BUFFER,	new Float32Array(v), gl.STATIC_DRAW );
	}

	add_space(x,y,z,r,f,res){
		let ns = {x:x,y:y,z:z,r:r,f:f,res:res, amt:1000, exp:1};
		this.spaces.push(ns);
		let i = this.spaces.length-1;
		this.build_space(i);
	}
	
	set_space(i, x,y,z,r,f,res){
		if(this.spaces.length > i){
			let s = this.spaces[i];
			if(res===undefined) res = s.res;
			if(x===undefined) x = s.x;
			if(y===undefined) y = s.y;
			if(z===undefined) z = s.z;
			if(r===undefined) r = s.r;
			if(f===undefined) f = s.f;
			let oldf = this.spaces[i].f;
			let oldres = this.spaces[i].res;
			this.spaces[i].x=x;
			this.spaces[i].y=y;
			this.spaces[i].z=z;
			this.spaces[i].r=r;
			this.spaces[i].f=f;
			this.spaces[i].res=res;
			if(oldf!=f || oldres[0]!=res[0] || oldres[1]!=res[1])
				this.build_space(i);
		}
	}
	rm_space(){
		if(this.spaces.length>1){
			this.delete_space();
			this.spaces.pop();
		}
	}
	delete_space(){
		let s = this.spaces[this.spaces.length-1];
		if(s.buf != undefined)
			gl.deleteBuffer(s.buf);
		s.buf = undefined;
	}


	setMesh( vertPos, texCoords, normals, elem ){
		this.numTriangles = vertPos.length / 3 / 3;
		let numV = vertPos.length / 3;
		var tris = [];
		for ( var i=0; i < numV; i++ ) {
			tris.push(vertPos[i*3 + 0]);
			tris.push(vertPos[i*3 + 1]);
			tris.push(vertPos[i*3 + 2]);
			tris.push(texCoords[i*2 + 0]);
			tris.push(texCoords[i*2 + 1]);
			tris.push(normals[i*3 + 0]);
			tris.push(normals[i*3 + 1]);
			tris.push(normals[i*3 + 2]);
		}
		gl.bindBuffer( gl.ARRAY_BUFFER, this.buf);
		gl.bufferData( gl.ARRAY_BUFFER,	new Float32Array(tris),	gl.STATIC_DRAW );
		
		this.numTriangles = elem.length / 3;
		gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.ibo);
		gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(elem), gl.STATIC_DRAW );
	}
		
	draw( matrixMVP, matrixMV, matrixNormal )
	{
		gl.enable(gl.BLEND);
		gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
		gl.bindTexture(gl.TEXTURE_2D, this.texture);

		gl.useProgram(this.prog);

		gl.uniformMatrix4fv( this.mvp_u, false, matrixMVP );
		gl.uniformMatrix4fv( this.mv_u, false, matrixMV );
		gl.uniformMatrix3fv( this.mn_u, false, matrixNormal );
		
		gl.uniform1i(this.tex_u, this.tex_unit );
		gl.uniform1i(this.show_tex_u, this.show_tex );
		gl.uniform1i(this.swapyz_u, this.swapyz );
		
		let ldir = [this.ldir.x, this.ldir.y, this.ldir.z];
		gl.uniform3fv(this.ldir_u, new Float32Array(ldir) );
		
		let lcol = [this.lcol.x, this.lcol.y, this.lcol.z];
		gl.uniform3fv(this.lcol_u, new Float32Array(lcol) );

		gl.uniform1f(this.lint_u, this.lint );

		
		if(this.show_mesh){
			gl.bindBuffer(gl.ARRAY_BUFFER, this.buf);
			gl.vertexAttribPointer(this.pos, 3, gl.FLOAT, false, 8*4, 0);
			gl.enableVertexAttribArray(this.pos);
			gl.vertexAttribPointer(this.uv, 2, gl.FLOAT, false, 8*4, 3*4);
			gl.enableVertexAttribArray(this.uv);
			gl.vertexAttribPointer(this.nor, 3, gl.FLOAT, false, 8*4, 5*4);
			gl.enableVertexAttribArray(this.nor);

			gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.ibo);
			gl.disable(gl.CULL_FACE);

			gl.drawElements(gl.TRIANGLES, this.numTriangles*3, gl.UNSIGNED_SHORT, 0);
		}


		{
			gl.enable(gl.CULL_FACE);
			gl.cullFace(gl.BACK);
			gl.bindTexture(gl.TEXTURE_2D, this.ground_tex);
			gl.bindBuffer(gl.ARRAY_BUFFER, this.ground_buf);
			gl.vertexAttribPointer(this.pos, 3, gl.FLOAT, false, 8*4, 0);
			gl.enableVertexAttribArray(this.pos);
			gl.vertexAttribPointer(this.uv, 2, gl.FLOAT, false, 8*4, 3*4);
			gl.enableVertexAttribArray(this.uv);
			gl.vertexAttribPointer(this.nor, 3, gl.FLOAT, false, 8*4, 5*4);
			gl.enableVertexAttribArray(this.nor);
			gl.drawArrays( gl.TRIANGLE_STRIP, 0, 4 );
			gl.disable(gl.CULL_FACE);
		}



		if(this.show_leaves){
			gl.bindBuffer(gl.ARRAY_BUFFER, this.leaves_vbo);
			gl.vertexAttribPointer(this.pos, 3, gl.FLOAT, false, 8*4, 0);
			gl.enableVertexAttribArray(this.pos);
			gl.vertexAttribPointer(this.uv, 2, gl.FLOAT, false, 8*4, 3*4);
			gl.enableVertexAttribArray(this.uv);
			gl.vertexAttribPointer(this.nor, 3, gl.FLOAT, false, 8*4, 5*4);
			gl.enableVertexAttribArray(this.nor);
			gl.drawArrays( gl.POINTS, 0, this.leaf_count );
		}
		
		if(this.show_spaces){
			gl.enable(gl.CULL_FACE);
			
			gl.enable(gl.DEPTH_TEST);
			gl.bindTexture(gl.TEXTURE_2D, this.sphere_tex);
			
			for (let i = 0; i < this.spaces.length*2; i++) {
				let hi = i;
				if(i>=this.spaces.length) hi = i-this.spaces.length;
				gl.bindBuffer(gl.ARRAY_BUFFER, this.spaces[hi].buf);
				
				let mv = GetModelViewMatrix(this.transX, this.transY, this.transZ,
					this.rotX, this.rotY,
					this.spaces[hi].x, this.spaces[hi].y, this.spaces[hi].z,
					this.spaces[hi].r, this.spaces[hi].r, this.spaces[hi].r
				);

				var mvp = MatrixMult( perspectiveMatrix, mv );
									
				var nrmTrans = [ mv[0],mv[1],mv[2], mv[4],mv[5],mv[6], mv[8],mv[9],mv[10] ];
				gl.uniformMatrix4fv( this.mvp_u, false, mvp );
				gl.uniformMatrix4fv( this.mv_u, false, mv );
				gl.uniformMatrix3fv( this.mn_u, false, nrmTrans )
				
				gl.vertexAttribPointer(this.pos, 3, gl.FLOAT, false, 8*4, 0);
				gl.enableVertexAttribArray(this.pos);
				gl.vertexAttribPointer(this.uv, 2, gl.FLOAT, false, 8*4, 3*4);
				gl.enableVertexAttribArray(this.uv);
				gl.vertexAttribPointer(this.nor, 3, gl.FLOAT, false, 8*4, 5*4);
				gl.enableVertexAttribArray(this.nor);
				
				if(i<this.spaces.length){
					gl.cullFace(gl.FRONT);
					gl.drawArrays( gl.TRIANGLE_STRIP, 0, this.spaces[hi].num_points );
				} else {
					gl.cullFace(gl.BACK);
					gl.drawArrays( gl.TRIANGLE_STRIP, 0, this.spaces[hi].num_points );
				}
			}
		}


	}
	
	setTexture( pixel, w,h ,tid, tu )
	{
		if (tid === undefined) tid=this.texture;
		if (tu === undefined) tu=0;

		gl.activeTexture(gl.TEXTURE0 + tu);
		gl.bindTexture(gl.TEXTURE_2D, tid);
		gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA,
			w, h, 0, gl.RGBA, gl.UNSIGNED_BYTE,
			pixel);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
	}
	
	// Este método se llama al actualizar la dirección de la luz desde la interfaz
	setLightDir( x, y, z )
	{	
		this.ldir = {}
		this.ldir.x = x;
		this.ldir.y = y;
		this.ldir.z = z;
	}
		
	// Este método se llama al actualizar el brillo del material 
	setShininess( shininess )
	{		
		this.lint = shininess;
	}


	gentex(){// generar textura
		let texa = [];
		let h=128, w=128;
		for(let i  = 0 ; i<h; i++){
		for(let j  = 0 ; j<w; j++){

			let rng = Math.random();
			if(i>h/2){
				//hojas
				// texa.push(rng*60,200-rng*200,rng*50,255);
				texa.push(90,100,50,255);
			} else {
				//tronco
				let r=59+rng*60, g=47, b=16;
				texa.push(r,g,b,255);
			}
		}}
		this.setTexture( new Uint8Array(texa), w,h , this.texture);

		w=8,h=8;
		let pixel=[];
		for(let i  = 0 ; i<h; i++){
		for(let j  = 0 ; j<w; j++){
			let r = 64;
			let g = 64;
			let b = 200;
			let a = 150;
			pixel.push( r,g,b,a );
		}}
		this.setTexture( new Uint8Array(pixel), w,h ,this.sphere_tex);
		
		
		let gpixel = [];
		let gh=128*4, gw=128*4;
		for(let i  = 0 ; i<gh; i++){
		for(let j  = 0 ; j<gw; j++){
			let rng = Math.random();
			gpixel.push(rng*40,255-rng*155,rng*50,255);
		}}
		this.setTexture( new Uint8Array(gpixel), gw,gh ,this.ground_tex);

	}

	get_radfun(f){
		switch(f){
			case 0:  return f0; break;
			case 1:  return f1; break;
			case 2:  return f2; break;
			case 3:  return f3; break;
			case 4:  return f4; break;
			case 5:  return f5; break;
			case 6:  return f6; break;
			case 7:  return f7; break;
			case 8:  return f8; break;
			case 9:  return f9; break;
			default: return f0; break;
		}
	}
	
	// generar hojas como puntos dentro de espacios
	generate_leaves(){
		let radfun;
		let pvs = [];
		let lc = 0; // leaf counter
		this.leaves = [];
		for(let i = 0 ; i < this.spaces.length; i++){
			radfun = this.get_radfun(this.spaces[i].f);
			
			let sx = this.spaces[i].x;
			let sy = this.spaces[i].y;
			let sz = this.spaces[i].z;
			for(let j = 0 ; j < this.spaces[i].amt; j++){
				let x = Math.random();
				let y = Math.random();
				let rs = Math.pow( Math.random(), 1/this.spaces[i].exp );
				let r = radfun(y, x) * this.spaces[i].r * rs;
				let p=[0,0,r,0];
				let rx = rotx( (x-.5) * Math.PI * 1.0); // 
				let ry = roty( y * Math.PI * 2.0);
				
				let R = MatrixMult(ry,rx);
				p=vec4mat4mult(p,R);
				
				let d=Math.sqrt(p[0]*p[0]+p[1]*p[1]+p[2]*p[2]);
				pvs.push( p[0]+sx, p[1]+sy, p[2]+sz,  0,1,  p[0]/d, p[1]/d, p[2]/d );
				
				lc++;
				p[3]=1;
				p[0]+=sx, p[1]+=sy, p[2]+=sz
				this.leaves.push(p);
			}
		}
		this.leaf_count = lc;
		gl.bindBuffer( gl.ARRAY_BUFFER, this.leaves_vbo);
		gl.bufferData( gl.ARRAY_BUFFER,	new Float32Array(pvs),	gl.STATIC_DRAW );
		
	}
	
	generate_tree( t ){
		this.generate_leaves();
		
		let max_iter = 500, iter=0;
		let branches = []
		let b = {x:0, y:-1, z:0, v:[0,0,0], vc:0, cd:0, l:0, r:this.init_rad}
		let actb = []
		actb.push(b)
		while((actb.length>0) && (iter < max_iter)){ iter++;
			this.leaves.forEach(leaf => {
				if(leaf[3]>0){
					let closest = -1;
					let closest_dist = 900000;
					let cv = [0,0,0]
					for(let i = 0 ; i < actb.length; i++){
						b = actb[i]
						let v = [leaf[0] - b.x , leaf[1] - b.y, leaf[2] - b.z]
						let d = Math.sqrt( v[0]*v[0]+v[1]*v[1]+v[2]*v[2] )
						if(this.Dk > d) 
							leaf[3] = 0
						else if( (d < closest_dist) ){
							closest_dist = d
							closest = i
							cv[0] = v[0]
							cv[1] = v[1]
							cv[2] = v[2]
						} 
					}
					if(this.Di > closest_dist){
						actb[closest].v[0] += cv[0] /closest_dist
						actb[closest].v[1] += cv[1] /closest_dist
						actb[closest].v[2] += cv[2] /closest_dist
						actb[closest].cd = Math.min( closest_dist, actb[closest].cd);
						if(actb[closest].vc<0) actb[closest].vc=0
						actb[closest].vc++
					}
				}
			});
			if(iter==max_iter) console.log("max iter reached");
			let actbb = []
			for(let i = actb.length ; i > 0; i--){
				let bb = actb.pop()

				if(bb.vc <= 0){
					bb.vc--;
					if(bb.vc < -2)
						branches.push({x:bb.x, y:bb.y, z:bb.z, r:bb.r, v:[bb.v[0], bb.v[1], bb.v[2], bb.r], vc:0, cd:10, l:bb.l });
					else{
						actbb.push({x:bb.x, y:bb.y, z:bb.z, r:bb.r, v:[bb.v[0], bb.v[1], bb.v[2], bb.r], vc:bb.vc, cd:10, l:bb.l})						
					}
				} else {
					let nr = Math.max( 0.008 , bb.v[1]>0 ? bb.r-.01 : bb.r-.03 );
					bb.v[0] /= bb.vc
					bb.v[1] /= bb.vc
					bb.v[2] /= bb.vc
					branches.push({x:bb.x, y:bb.y, z:bb.z, r:bb.r, v:[bb.v[0]*bb.cd, bb.v[1]*bb.cd, bb.v[2]*bb.cd, nr], vc:0 ,cd:10, l:0})

					let bc = {x:bb.x+bb.v[0]*bb.cd, y:bb.y+bb.v[1]*bb.cd, z:bb.z+bb.v[2]*bb.cd, r:nr, v:[0,0,0,nr], vc:0, cd:10, l:1};
					
					actbb.push(bc); // push new
					let knott = bb.v[1]*bb.cd<-0.001; // agrega una punta para evitar el agujero en uniones q apuntan hacia abajo
					actbb.push({x:bb.x, y:bb.y, z:bb.z, r:bb.r, v:[0,0,0,nr], vc:0, cd:10, l:(knott?1:0) }); // push rama original
				}
			}
			actb = actbb
		}

		let vertPos = [];
		let texCoords = [];
		let normals = [];
		let elem = [];
		console.log(branches.length)
		for (let i = 0; i < branches.length; i++) {
			agregar_segmento(branches[i], vertPos, texCoords, normals, elem, 6);
		}
		
		this.setMesh( vertPos, texCoords, normals, elem );

		DrawScene();
	}
}

// Vertex Shader
var meshVS = `
	attribute vec3 pos;
	attribute vec2 uv;
	attribute vec3 nor;

	uniform mat4 mvp;
	uniform int swapyz;

	varying vec2 texCoord;
	varying vec3 normCoord;
	varying vec4 vertCoord;

	void main()
	{ 
		if(swapyz == 0){
			gl_Position = mvp * vec4(pos, 1.0);
			vertCoord=vec4(pos, 1.0);
			normCoord=nor;
		}
		else{
			gl_Position = mvp * vec4(pos.xzy, 1.0);
			vertCoord=vec4(pos.xzy, 1.0);
			normCoord=nor.xzy;
		}
		texCoord=uv;
	}
`;

// Fragment Shader
var meshFS = `
	precision mediump float;
	
	uniform mat4 mv;
	uniform mat3 mn;

	varying vec2 texCoord;
	varying vec3 normCoord;
	varying vec4 vertCoord;

	uniform vec3 ldir;
	uniform vec3 lcol;
	uniform float lint;
	
	uniform sampler2D tex;
	uniform int show_tex;

	vec3 blinn_phong(vec3 diff){
		vec3 fcol = vec3(1,1,1);

		vec3 n = normalize(mn*normalize(normCoord));
		vec3 l = normalize(ldir);
		vec3 p = normalize( ( mv * vertCoord ).xyz );
		// float cosa = max( 0.0 , dot(n,l));
		float cosa_bias = .15;
		float cosa = min( 1.0, max( 0.0 , dot(n,l) +cosa_bias) ); 
		vec3 spec=vec3(.1,.2,.1);

		vec3 ldiff = diff*lcol*cosa;
		//specular
		// blinn-phong
		// vec3 h = normalize(l-p);
		// fcol = ldiff + lcol*spec*pow(max(0.0, dot(h,n)), lint)*cosa;
		// reflect
		vec3 r = reflect(-l,n);
		fcol = ldiff + lcol*spec*pow(max(0.0, dot(r,-p)), lint)*cosa;

		return fcol;
	}

	void main()
	{		
		vec3 diff = vec3(1.0,1.0,1.0);
		float alpha = 1.0;
		if( show_tex == 1 ){
			vec4 tex = texture2D(tex, texCoord);
			diff = tex.rgb;
			alpha = tex.a;
		}

		vec3 light = blinn_phong(diff);
		gl_FragColor = vec4( light, alpha );
	}
`;

function f0(x,y){
	return -1;
}
function f1(x,y){
	return -2*( x*x*y*y );
}
function f2(x,y){
	return -.75*( Math.abs(Math.sin(x*6*Math.PI)) + Math.abs(Math.sin(y*6*Math.PI)) );
}
function f3(x,y){
	return .5*(-Math.pow(y,2)*3-Math.abs(Math.sin(x*6*Math.PI)) );
}
function f4(x,y){return -.75*( Math.abs(Math.sin(x*7*Math.PI)) + Math.abs(Math.sin(y*3*Math.PI)) );}
function f5(x,y){return -.75*( Math.abs(Math.sin(x*3*Math.PI)) + Math.abs(Math.sin(y*3*Math.PI)) );}
function f6(x,y){return -.75*( Math.abs(Math.sin(x*4*Math.PI)) + Math.abs(Math.sin(y*4*Math.PI)) );}
function f7(x,y){return -.75*( Math.abs(Math.sin(x*7*Math.PI)) + Math.abs(Math.sin(y*3*Math.PI)) );}
function f8(x,y){return -.75*( Math.abs(Math.sin(x*2*Math.PI)) + Math.abs(Math.sin(y*4*Math.PI)) );}
function f9(x,y){return -.75*( Math.abs(Math.sin(x*8*Math.PI)) + Math.abs(Math.sin(y*8*Math.PI)) );}


// a: slices, b: vertical segments
// out format 3float pos, 2float uv, 3float normal, ; interleaved
function create_sphere( a, b, f ){
	let vs = [];
	
	let radfun = This.get_radfun(f);

	for (let i = 0; i < a-1; i++) {
		let fi = parseFloat(i);
		for (let j = 0; j <= b; j++) {
			
			let fj = parseFloat(j);
			let r = radfun(fj/(b), fi/(a-1));
			let p=[0,0,r,0];
			let rx = rotx( (fi/(a-1)-.5) * Math.PI * 1.0); // 
			let ry = roty( fj/(b) * Math.PI * 2.0);

			let R = MatrixMult(ry,rx);
			p=vec4mat4mult(p,R);
			vs.push( p[0], p[1], p[2],  fj/b,fi/(a-1),  p[0], p[1], p[2] );

			// segunda cara 
			 r = radfun((fj)/(b), (fi+1.0)/(a-1));
			 p=[0,0,r,0];
			 rx = rotx( ((fi+1.0)/(a-1)-.5) * Math.PI * 1.0); // 
			 ry = roty( fj/(b) * Math.PI * 2.0);
			 R=MatrixMult(ry,rx);
			p=vec4mat4mult(p,R);

			vs.push( p[0], p[1], p[2], fj/b,(fi+1)/(a-1),  p[0], p[1], p[2] );

			// push degen triangle
			if(j==b){
				vs.push( p[0], p[1], p[2], fj/b,(fi+1)/(a-1),  p[0], p[1], p[2] );
				vs.push( p[0], p[1], p[2], fj/b,(fi+1)/(a-1),  p[0], p[1], p[2] );
			}
		}	
	}
	return vs;
}

// function vec4mat4mult( v, m ){
// 	return [
// 		v[0] * m[0] + v[1] * m[1] + v[2] * m[2]  + v[3] * m[3], 
// 		v[0] * m[4] + v[1] * m[5] + v[2] * m[6]  + v[3] * m[7], 
// 		v[0] * m[8] + v[1] * m[9] + v[2] * m[10] + v[3] * m[11], 
// 		v[0] * m[12] + v[1] * m[13] + v[2] * m[14] + v[3] * m[15]
// 	];
// }
function vec4mat4mult( v, m ){
	return [
		v[0] * m[0] + v[1] * m[4] + v[2] * m[8]  + v[3] * m[12], 
		v[0] * m[1] + v[1] * m[5] + v[2] * m[9]  + v[3] * m[13], 
		v[0] * m[2] + v[1] * m[6] + v[2] * m[10] + v[3] * m[14], 
		v[0] * m[3] + v[1] * m[7] + v[2] * m[11] + v[3] * m[15]
	];
}


// https://en.wikipedia.org/wiki/Rotation_matrix#In_three_dimensions
function rotx(theta){
	return Array(
		1.0, 0.0,              0.0,             0.0,
		0.0, Math.cos(theta),  Math.sin(theta), 0.0,
		0.0, -Math.sin(theta), Math.cos(theta), 0.0,
		0.0, 0.0,              0.0,             1.0,
	);
}
function roty(theta){
	return Array(
		Math.cos(theta), 0.0, -Math.sin(theta), 0.0,
		0.0,             1.0, 0.0,              0.0,
		Math.sin(theta), 0.0, Math.cos(theta),  0.0,
		0.0,             0.0, 0.0,              1.0,
	);
}













function agregar_segmento(branch, vertPos, texCoords, normals, elem, sides){
	let theta = 2*Math.PI / sides;
	let c = Math.cos(theta);
	let s = Math.sin(theta);
	let circ0 = []; // circulo unitario en 0,0,0
	let circ1 = [];
	let circ2 = [];
	// contruir circulo unitario de n lados
	let x2 = 1;
	let z2 = 0;
	for(let i=0; i<=sides; i++) {
		circ0.push(0+x2, 0, 0+z2);
		let x3 = x2;
		x2 = c*x2-s*z2;
		z2 = s*x3+c*z2;
	}
	
	let x; let y; let z;
	let px; let py; let pz;
	let r0;
	let r1;
	if(branch.l!=0) {
		branch.v[1]+=branch.r; branch.v[3]=0;
	}


	if(branch.y > branch.y+branch.v[1]){
		r0=branch.r;
		r1=branch.v[3];
		x=branch.x;
		y=branch.y;
		z=branch.z;
		px=branch.x + branch.v[0];
		py=branch.y + branch.v[1];
		pz=branch.z + branch.v[2];
	} else {
		r0=branch.v[3];
		r1=branch.r;
		x=branch.x + branch.v[0];
		y=branch.y + branch.v[1];
		z=branch.z + branch.v[2];
		px=branch.x;
		py=branch.y;
		pz=branch.z;
	}
	
	// transponer y escalar circulo 
	for(let i=0; i<=sides; i++) {
		circ1.push( circ0[i*3+0]*r1+px, circ0[i*3+1]*r1+py, circ0[i*3+2]*r1+pz );
		circ2.push( circ0[i*3+0]*r0+x, circ0[i*3+1]*r0+y, circ0[i*3+2]*r0+z );
	}
	
	let vlen0 = vertPos.length / 3;

	for(let i=0; i<=sides; i++) {
		vertPos.push( circ1[i*3+0],circ1[i*3+1],circ1[i*3+2], circ2[i*3+0],circ2[i*3+1],circ2[i*3+2]);
		
		let tx = i/sides;
		if(branch.l){
			texCoords.push(tx,.5);
			texCoords.push(tx,1);
		} else {
			texCoords.push(tx,0);
			texCoords.push(tx,.5);
		}
		
		//normales
		let p0x = circ1[i*3+0];
		let p0y = circ1[i*3+1];
		let p0z = circ1[i*3+2];
		let p1x = circ2[i*3+0];
		let p1y = circ2[i*3+1];
		let p1z = circ2[i*3+2];
		let p2x;
		let p2y;
		let p2z;
		if(i<sides){
			p2x = circ1[(i+1)*3+0];
			p2y = circ1[(i+1)*3+1];
			p2z = circ1[(i+1)*3+2];
		} else {
			p2x = circ1[3+0];
			p2y = circ1[3+1];
			p2z = circ1[3+2];
		}
		let n1 = normal3puntos(p0x, p0y, p0z, p1x, p1y, p1z, p2x, p2y, p2z);
		normals.push(n1[0], n1[1], n1[2]);
		normals.push(n1[0], n1[1], n1[2]);
	}

	// index buffer
	let ib = vlen0;
	for(let i=0; i<sides; i++) {
		elem.push( ib, ib+2, ib+1, ib+1, ib+2, ib+3);
		ib+=2;
	}

}






function normal3puntos(p0x, p0y, p0z, p1x, p1y, p1z, p2x, p2y, p2z){
	let n = cross(p1x-p0x, p1y-p0y, p1z-p0z, p2x-p0x, p2y-p0y, p2z-p0z);
	// let n = cross(p2x-p0x, p2y-p0y, p2z-p0z, p1x-p0x, p1y-p0y, p1z-p0z);
	let nl = Math.sqrt(n[0]*n[0]+n[1]*n[1]+n[2]*n[2]);
	n[0]/=nl;
	n[1]/=nl;
	n[2]/=nl;
	return n;
}

function cross(x0,y0,z0, x1,y1,z1){
	let r = [];
	r.push(y0* z1- z0* y1);
	r.push(z0* x1- x0* z1);
	r.push(x0* y1- y0* x1);
	return r;
}

function v3len(x,y,z){ return Math.sqrt(x*x+y*y+z*z);}














function GetModelViewMatrix( translationX, translationY, translationZ, rotationX, rotationY ,modelx,modely,modelz,sx,sy,sz)
{
	if(modelx === undefined) modelx = 0;
	if(modely === undefined) modely = 0;
	if(modelz === undefined) modelz = 0;
	if(sx === undefined) sx = 1;
	if(sy === undefined) sy = 1;
	if(sz === undefined) sz = 1;
	// Matriz de traslación
	var m = [
		sx, 0, 0, 0,
		0, sy, 0, 0,
		0, 0, sz, 0,
		modelx, modely, modelz, 1
	]
	var trans = [
		1, 0, 0, 0,
		0, 1, 0, 0,
		0, 0, 1, 0,
		translationX, translationY, translationZ, 1
	];
	var rx = rotx(rotationX);
	var ry = roty(rotationY);
	
	var mv = trans;
	mv = MatrixMult( mv, rx );
	mv = MatrixMult( mv, ry );
	
	mv = MatrixMult( mv, m);
	return mv;
}
