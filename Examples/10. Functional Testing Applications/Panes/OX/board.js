ko.composite.registerModel(function(pubsub, data, pane) {
    var self = this;

    self.currentPlayer = ko.observable('X');
    self.rows = [];
    self.inProgress = ko.observable(true);
    self.winner = ko.observable();

    self.initialise = function () {
        for (var row = 0; row < 3; row++) {
            self.rows.push([]);
            for (var column = 0; column < 3; column++) {
                self.rows[row].push(new Piece(row, column));
            }
        }
    };

    self.selectPiece = function(piece) {
        if(!piece.player() && self.inProgress()) {
            piece.player(self.currentPlayer());
            checkForWinner(piece, self.currentPlayer());
            swapTurn();
        }
    };

    function Piece(row, column) {
        this.row = row;
        this.column = column;
        this.player = ko.observable();
        this.winningPiece = ko.observable(false);
    }
    
    function checkForWinner(piece) {
        var player = self.currentPlayer();
        checkPiecesForWinner(self.rows[piece.row], player);
        checkPiecesForWinner(column(piece.column), player);
        checkPiecesForWinner(diagonal(true), player);
        checkPiecesForWinner(diagonal(false), player);
    }
    
    function checkPiecesForWinner(pieces, player) {
        var won = _.all(pieces, function(piece) {
            return piece.player() === player;
        });

        if (won) {
            _.forEach(pieces, function(piece) {
                piece.winningPiece(true);
            });
            endGame(player);
        }

        return won;
    }
    
    function column(index) {
        return [self.rows[0][index], self.rows[1][index], self.rows[2][index]];
    }

    function diagonal(leading) {
        if(leading)
            return [self.rows[0][0], self.rows[1][1], self.rows[2][2]];
        else
            return [self.rows[2][0], self.rows[1][1], self.rows[0][2]];
    }

    function endGame(winner) {
        self.inProgress(false);
        self.winner(winner);
    }

    function swapTurn() {
        self.currentPlayer(self.currentPlayer() === 'X' ? 'O' : 'X');
    }
});