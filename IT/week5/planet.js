const day = 24.0*60*60; //тривалість земного дня у секундах
const dt = day/3; //крок інтегрування
const G=6.67e-11; //гравітаційна стала

AFRAME.registerComponent('planet', {
	schema: {
		name: {type: 'string', default: ""},
		//ім'я планети
		//середня відстань планети від Сонця
		dist: {type: 'number', default: 0},
		mass: {type: 'number', default: 0}, //маса планети, кг
		T: {type: 'number', default: 0}, //планетарний рік, земних днів
		
		v: {type: 'array', default: [0,0,0]}, //вектор швидкості
		a: {type: 'array', default: [0,0,0]}, //вектор прискорення
		//координатний радіус-вектор
		pos: {type: 'array', default: [0,0,0]}
	},

	init: function () {
		this.data.T*=day; //переводимо із земних днів у секунди
		this.data.pos[0]=this.data.dist; //розташовуємо на вісі x
		//візуальну позицію виражаємо у мільйонах кілометрів
		this.el.setAttribute('position',this.data.dist/1e9+' 0 0');
		if(this.data.T!=0)//для всіх об'єктів, крім Сонця,
			//обчислюємо початкову швидкість вздовж вісі y
			this.data.v[1] = 2*Math.PI*this.data.dist/this.data.T;
	}
});


AFRAME.registerComponent('main', {
	init: function() {
		this.solar_system = document.querySelectorAll('[planet]');
	},
	tick: function (time, deltaTime) {
    for(var i = 0; i < this.solar_system.length; i++) {
        let el = this.solar_system[i];
        let planet_i = el.getAttribute('planet'); // Отримуємо дані
        
        planet_i.a = [0, 0, 0]; // Скидаємо прискорення
        
        // Розрахунок гравітації
        for(var j = 0; j < this.solar_system.length; j++) {
            if(i != j) {
                let planet_j = this.solar_system[j].getAttribute('planet');
                let deltapos = [0, 0, 0];
                for(var k = 0; k < 3; k++) deltapos[k] = planet_j.pos[k] - planet_i.pos[k];
                
                let r = Math.sqrt(deltapos[0]**2 + deltapos[1]**2 + deltapos[2]**2);
                for(var k = 0; k < 3; k++) {
                    planet_i.a[k] += G * planet_j.mass * deltapos[k] / Math.pow(r, 3);
                }
            }
        }
        
        // Оновлення швидкості та позиції
        for(var k = 0; k < 3; k++) {
            planet_i.v[k] += planet_i.a[k] * dt;
            planet_i.pos[k] += planet_i.v[k] * dt;
        }

        // КРИТИЧНО: зберігаємо оновлені дані назад у компонент
        el.setAttribute('planet', planet_i); 
        
        // Візуалізація (ділимо на 1e9, щоб планети були в межах видимості)
        el.setAttribute('position', {
            x: planet_i.pos[0] / 1e9,
            y: planet_i.pos[1] / 1e9,
            z: planet_i.pos[2] / 1e9
        });
    }
}
});
