package com.seichi.backend;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.context.properties.ConfigurationPropertiesScan;

@SpringBootApplication
@ConfigurationPropertiesScan
public class SeichiBackendApplication {

    public static void main(String[] args) {
        SpringApplication.run(SeichiBackendApplication.class, args);
    }
}
