package com.proyectoJuegoCalabozos.Proyecto.repository;




import com.proyectoJuegoCalabozos.Proyecto.model.Player;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface PlayerRepository extends JpaRepository<Player,Long>{
   
Player findPlayerByUsername(String userName);
    
}
