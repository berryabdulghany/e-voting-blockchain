pragma solidity ^0.5.15;

contract Voting {
    // Struktur Data Kandidat (LENGKAP)
    struct Candidate {
        uint id;
        string name;
        string organization; // Pengganti Party
        string vision;       // Visi Misi (Baru)
        string photo;        // Nama File Foto (Baru)
        uint voteCount;
    }

    // Penyimpanan
    mapping (uint => Candidate) public candidates;
    mapping (address => bool) public voters;

    uint public countCandidates;
    uint256 public votingEnd;
    uint256 public votingStart;
    address public owner; 

    // Event (PENTING buat Realtime)
    event votedEvent (
        uint indexed _candidateId
    );

    event candidateAdded (
        uint id,
        string name,
        string organization
    );

    constructor() public {
        owner = msg.sender;
    }

    modifier onlyOwner() {
        require(msg.sender == owner, "Hanya Admin yang boleh melakukan ini!");
        _;
    }

    // Fungsi Tambah Kandidat (4 Parameter: Nama, Org, Visi, Foto)
    function addCandidate(string memory name, string memory organization, string memory vision, string memory photo) public onlyOwner returns(uint) {
        countCandidates ++;
        // Simpan data lengkap ke Blockchain
        candidates[countCandidates] = Candidate(countCandidates, name, organization, vision, photo, 0);
        emit candidateAdded(countCandidates, name, organization);
        return countCandidates;
    }
    
    function vote(uint candidateID) public {
        require(now >= votingStart && now <= votingEnd, "Voting belum dimulai atau sudah selesai");
        require(candidateID > 0 && candidateID <= countCandidates, "Kandidat tidak ditemukan");
        require(!voters[msg.sender], "Anda sudah melakukan voting!");
              
        voters[msg.sender] = true;
        candidates[candidateID].voteCount ++;        
        emit votedEvent(candidateID);
    }
     
    function checkVote() public view returns(bool){
        return voters[msg.sender];
    }
        
    function getCountCandidates() public view returns(uint) {
        return countCandidates;
    }

    // Fungsi Ambil Data (Return 6 Data)
    function getCandidate(uint candidateID) public view returns (uint, string memory, string memory, string memory, string memory, uint) {
        return (
            candidateID,
            candidates[candidateID].name,
            candidates[candidateID].organization,
            candidates[candidateID].vision,
            candidates[candidateID].photo,
            candidates[candidateID].voteCount
        );
    }

    function setDates(uint256 _startDate, uint256 _endDate) public onlyOwner {
        require(_endDate > _startDate, "Tanggal Selesai harus setelah Tanggal Mulai");
        require(_endDate > now, "Tanggal Selesai tidak boleh di masa lalu");
        votingEnd = _endDate;
        votingStart = _startDate;
    }

    function getDates() public view returns (uint256,uint256) {
      return (votingStart,votingEnd);
    }
}