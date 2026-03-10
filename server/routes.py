from router import Router
from database import Database

router = Router()
db = Database()

#Rota para listar tutores
@router.get('/api/tutores')
def lista_tutores(req, res):
    tutores = db.listar_tutores()
    return res.json({
        "tutores": tutores
    })

#Rota para listar pets
@router.get('/api/pet')
def lista_pets(req, res):
    pets = db.listar_pets()
    return res.json({
        "pets": pets
    })

#Rota de cadastro tutor
@router.post('/api/cad_tutores')
def cad_tutor(req, res):
    dados = req.body
    tutor = db.cadastrar_tutor(dados)
    return res.json({
        "message": "Tutor cadastrado",
        "tutor": tutor
    })
    
#Rota de cadastro do pet
@router.post('/api/cad_pet')
def cad_pet(req, res):
    dados = req.body
    pet = db.cadastrar_pet(dados)
    return res.json({
        "message": "Pet cadastrado",
        "pet": pet
    })

#Rota de cadastro para atualizar tutor
@router.put('/api/att_tutores/:id')
def atualiza_tutor(req, res):
    id = req.params["id"]
    dados = req.body
    tutor = db.atualizar_tutor(id, dados)
    return res.json(tutor)

#Rota de cadastro para atualizar pet
@router.put('/api/att_pet/:id')
def atualiza_pet(req, res):
    id = req.params("id")
    dados = req.body
    pet = db.atualizar_pet(id, dados)

    return res.json(pet)

#Rota de delete tutor
@router.delete('/api/del_tutores/:id')
def delete_tutor(req, res):
    id_tutor = req.params["id"]
    db.deletar_tutor(id_tutor)
    return res.json({
        "message": "Tutor deletado."
    })

#Rota de delete pet
@router.delete('/api/del_pet/:id')
def delete_pet(req, res):
    id_pet = req.params("id")
    db.deletar_pet(id_pet)
    return res.json({
        "message": "Pet deletado."
    })
