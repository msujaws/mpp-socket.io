/**
 * Calculate Ball Position.
 */
 
var constants = { court: { width: 500, height: 500 }, 
				  paddle: { width: 100, height: 15, delta: 3 },
				  ball: { radius: 10, deltaLeft: 2, deltaTop: 2, interval: 10 }
				};
					
var state = { paddles: {},
			  ball: { left: constants.court.width / 2, top: constants.court.height / 2 },
			  bottomPaddle: 0,
			  topPaddle: 0,
			  leftPaddle: 0,
			  rightPaddle: 0,
			  names: {}
			}
 
var calculateBallPosition = function() {
    var left = state.ball.left + constants.ball.deltaLeft;
    var top = state.ball.top + constants.ball.deltaTop;

    //RIGHT SIDE
	if (left + constants.ball.radius >= constants.court.width - constants.paddle.height ) {
		if ( state.rightPaddle ) {
			if ( ballHitRightPaddle( top ) ) {
				left = constants.court.width - constants.paddle.height - constants.ball.radius;
				constants.ball.deltaLeft = -constants.ball.deltaLeft;				
			} else {
				console.log( 'game over right');
				left = constants.court.width / 2;
				top = constants.court.height / 2; 			
			}		
		} else if ( left + constants.ball.radius >= constants.court.width ) {
			left = constants.court.width - constants.ball.radius;
			constants.ball.deltaLeft = -constants.ball.deltaLeft;
		}
    }
	
	//LEFT SIDE
	if ( left - constants.ball.radius <= constants.paddle.height ) {		
		if ( state.leftPaddle ) {
			if ( ballHitLeftPaddle( top ) ) {
				left = constants.paddle.height + constants.ball.radius;
				constants.ball.deltaLeft = -constants.ball.deltaLeft;	
			} else {
				console.log( 'game over left' );
				left = constants.court.width / 2;
				top = constants.court.height / 2; 
			}
		} else if (left - constants.ball.radius <= 0) {
			left = 0 + constants.ball.radius;
			constants.ball.deltaLeft = -constants.ball.deltaLeft;		
		}
	}
	
	
	//BOTTOM SIDE
	if (top + constants.ball.radius >= constants.court.height - constants.paddle.height) {
		if ( state.bottomPaddle ) {		
			if ( ballHitBottomPaddle( left ) ) {
				top = constants.court.height - constants.paddle.height - constants.ball.radius;
				constants.ball.deltaTop = -constants.ball.deltaTop;			
			} else {
				console.log( 'game over bottom');
				left = constants.court.width / 2;
				top = constants.court.height / 2; 			
			}
		} else if ( top + constants.ball.radius >= constants.court.height ){
			top = constants.court.height - constants.ball.radius;
			constants.ball.deltaTop = -constants.ball.deltaTop;
		}
	}
	
	//TOP SIDE
	if ( top - constants.ball.radius <= constants.paddle.height ) {	
		if ( state.topPaddle ) {
            if ( ballHitTopPaddle( left ) ) {
				top = constants.paddle.height + constants.ball.radius ;
				constants.ball.deltaTop = -constants.ball.deltaTop;			
			}
			else {
				console.log( 'game over top');
				left = constants.court.width / 2;
				top = constants.court.height / 2; 			
			}
        } else if ( top - constants.ball.radius <= 0 ) {	
			//WALL
			top = constants.paddle.height + constants.ball.radius;
			constants.ball.deltaTop = -constants.ball.deltaTop;	
		}
	}    
	
  state.ball.left = left;
  state.ball.top = top;
};

var ballHitTopPaddle = function( x ){
	if ( x > ( (state.paddles[state.topPaddle]/100) * constants.court.width - constants.paddle.width / 2) ) 
	{
		if (x < ( (state.paddles[state.topPaddle]/100) * constants.court.width + constants.paddle.width / 2) )		
			return true;		
		else return false;
	} else return false;
}

var ballHitBottomPaddle = function( x ){
	if (x > ( (state.paddles[state.bottomPaddle]/100) * constants.court.width - constants.paddle.width / 2) ) 
	{
		if (x < ( (state.paddles[state.bottomPaddle]/100) * constants.court.width + constants.paddle.width / 2) )		
			return true;		
		else return false;
	} else return false;
}

var ballHitLeftPaddle = function( x ){
	if ( x > ( (state.paddles[state.leftPaddle]/100) * constants.court.height - constants.paddle.width / 2) ) 
	{
		if (x < ( (state.paddles[state.leftPaddle]/100) * constants.court.height + constants.paddle.width / 2) )		
			return true;		
		else return false;
	} else return false;
}

var ballHitRightPaddle = function( x ){
	if (x > ( (state.paddles[state.rightPaddle]/100) * constants.court.height - constants.paddle.width / 2) ) 
	{
		if (x < ( (state.paddles[state.rightPaddle]/100) * constants.court.height + constants.paddle.width / 2) )		
			return true;		
		else return false;
	} else return false;
}

var addPlayer = function( id ) {
	var paddleAdded = false;
	if (!state.bottomPaddle) {
		state.bottomPaddle = id;
	} else if (!state.topPaddle) {
		state.topPaddle = id;
	} else if (!state.leftPaddle) {
		state.leftPaddle = id;
	} else if (!state.rightPaddle) {
		state.rightPaddle = id;
	} else {
	  // placeholder for fifth player
	  return;
	}
	state.paddles[id] = 50;
}


exports.main = function( io, socket, serverState ) {

  addPlayer( socket.id );
  
	socket.emit('environment', { court:  {  width:  constants.court.width, 
                               height: constants.court.height,
                             }, 
								 paddle: {  width: constants.paddle.width, 
											height: constants.paddle.height,
											delta: constants.paddle.delta
										 },
								 ball: { radius: constants.ball.radius },
								 player: { id: socket.id, names: state.names }
	});
  
  if ( !serverState.intervalId ) {
      serverState.intervalId = setInterval( function(){
          calculateBallPosition();
      }, constants.ball.interval );  
  }
  
  socket.intervalId = setInterval( function(){
      socket.emit('ball', { position: { left: state.ball.left, top: state.ball.top } });             
  }, constants.ball.interval );   
  
  io.sockets.emit('paddles', { positions: state.paddles, sides: {bottom: state.bottomPaddle, top: state.topPaddle, left: state.leftPaddle, right: state.rightPaddle }});     

  socket.on('paddle', function (data) {
    io.sockets.emit('paddles', { positions: state.paddles, sides: {bottom: state.bottomPaddle, top: state.topPaddle, left: state.leftPaddle, right: state.rightPaddle }});     
    state.paddles[socket.id] = data.left;
  });
  
}